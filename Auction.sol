// SPDX-License-Identifier: GPL-3.0

pragma solidity >0.4.0 <0.9.0;

// [Cerinta opționala] Utilizare librarie
library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction underflow");
        uint256 c = a - b;
        return c;
    }
}


// [Cerință opțională] Utilizare interfata (OOP - Abstractizare)
// Interfata pentru votare
interface IAuction {
    function placeBid() external payable;
    function endAuction() external;
    function getHighestBid() external view returns (uint);
    function getHighestBidder() external view returns (address);
}

// Contract principal care implementeaza interfata IAuction
contract Auction is IAuction {
    using SafeMath for uint256;

    // [Cerință obligatorie]
    // 1. Utilizarea tipurilor de date specifice Solidity (mappings, address)
    mapping(address => uint) biddersData;

    // Array pentru a păstra toate adresele ofertanților
    address[] biddersList;

    // Variabile
    address public owner;
    uint public highestBid;
    address public highestBidder;
    uint startTime = block.timestamp;
    uint endTime;

    // [Cerință obligatorie]
    // 2. Înregistrarea de events
    event AuctionStarted(uint256 startTime, uint256 endTime);
    event AuctionEnded(address highestBidder, uint256 highestBid);
    event NewHighestBid(address indexed bidder, uint256 amount);
    event BidWithdrawn(address indexed bidder, uint256 amount);

    // [Cerință obligatorie]
    // 3. Utilizarea de modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can call this function");
        _;
    }

    modifier auctionActive() {
        require(block.timestamp < endTime, "Auction is not active!");
        _;
    }


    modifier hasBid() {
        require(biddersData[msg.sender] > 0, "No bid to withdraw!");
        _;
    }

    constructor() {
        owner = msg.sender;
    }


    // put new bid
    function placeBid() external payable auctionActive {
        require(msg.value > 0, "Bid amount must be greater than zero!");
        //require(block.timestamp < endTime, "Auction is not active!");
        require(msg.value > highestBid, "Bid is too low!");

        // Dacă utilizatorul licitează pentru prima dată, îl adăugăm în listă
        if (biddersData[msg.sender] == 0) {
            biddersList.push(msg.sender);
        }

        // Salvăm bid-ul ofertantului
        biddersData[msg.sender] += msg.value;

        // Actualizăm cel mai mare bid
        highestBid = biddersData[msg.sender];
        highestBidder = msg.sender;

        emit NewHighestBid(msg.sender, msg.value);
    }


    // verific daca utilizatorul a mai licitat
    function alreadyBid(address _bidder) private view returns (bool) {
        return biddersData[_bidder] > 0;
    }


    // [Cerință obligatorie] Functie pentru transfer ETH
    // withdraw bid 
    function withdrawBid(address payable _address) public hasBid {
        uint amount = biddersData[_address];
        require(alreadyBid(_address), "No bid to withdraw!");

        // Resetăm suma ofertantului înainte de transfer
        biddersData[_address] = 0;

        // Dacă ofertantul care retrage este highestBidder, trebuie să căutăm altul
        if (_address == highestBidder) {
            highestBid = 0;
            highestBidder = address(0);

            // Căutăm cel mai mare bid rămas
            for (uint i = 0; i < biddersList.length; i++) {
                address bidder = biddersList[i];
                if (biddersData[bidder] > highestBid) {
                    highestBid = biddersData[bidder];
                    highestBidder = bidder;
                }
            }
        }

        (bool success, ) = _address.call{value: amount}(""); // ex transfer ETH
        require(success, "Transfer failed!");

        emit BidWithdrawn(_address, amount);
    }


    // start the auction with a specified duration 
    function startAuction(uint _duration) external onlyOwner {
        require(endTime == 0 || block.timestamp > endTime, "Auction already started!");

        startTime = block.timestamp;
        //endTime = startTime + _duration;
        endTime = startTime.add(_duration); //adaugat SafeMath

        emit AuctionStarted(startTime, endTime);
    }


    // end Auction  
    function endAuction() public onlyOwner {
        //require(block.timestamp >= endTime, "Auction is still active!");
        require(block.timestamp < endTime, "Auction already ended!");

        // Resetarea variabilelor pentru următoarea licitație
        endTime = block.timestamp;
        highestBid = 0;
        highestBidder = address(0);

        emit AuctionEnded(highestBidder, highestBid);
    }



    //get highest bid amount
    function getHighestBid() external view override returns (uint) {
        return highestBid;
    }


    // get highest bidder  
    function getHighestBidder() external view override returns (address) {
        return highestBidder;
    }


    // get contract owner
    function getOwner() external view returns (address) {
        return owner;
    }

    
    // check if auction is active 
    function isAuctionActive() external view returns (bool) {
        return (block.timestamp < endTime);
    }


    // Functie fallback pentru a primi ETH
    receive() external payable {}
    
}

// [Cerință obligatorie] Interacțiune între smart contracte
// Contract secundar pentru interactiune
contract HelperContract {
    function getBalance(address contractAddress) external view returns (uint) {
        return contractAddress.balance;
    }
}