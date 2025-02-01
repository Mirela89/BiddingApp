// Variabile globale
let provider, signer, contract;

// Configuratie contract
const contractAddress = "0x6C48Cd00eDE833BC7E7879C6026f3a0B01745268"; 
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "highestBidder",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "highestBid",
				"type": "uint256"
			}
		],
		"name": "AuctionEnded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			}
		],
		"name": "AuctionStarted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "bidder",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "BidWithdrawn",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "bidder",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "NewHighestBid",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "endAuction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getHighestBid",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getHighestBidder",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getOwner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "highestBid",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "highestBidder",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isAuctionActive",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "placeBid",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_duration",
				"type": "uint256"
			}
		],
		"name": "startAuction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_address",
				"type": "address"
			}
		],
		"name": "withdrawBid",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
];

// FUNCTII
// Conectare automata la MetaMask daca utilizatorul a fost deja conectat
async function autoConnect() {
    if (typeof window.ethereum !== "undefined") {
        provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
            signer = await provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            
            const account = await signer.getAddress();
            document.getElementById("account").innerText = `Account: ${account}`;
            const balance = await provider.getBalance(account);
            document.getElementById("balance").innerText = `Balance: ${ethers.formatEther(balance)} ETH`;

            listenForEvents(); // Ascult evenimentele contractului dupa conectare
        }
    }
}
window.onload = autoConnect;

// [Cerinta optionala]
// Tratare events (Observer Pattern)
function listenForEvents() {
    contract.on("AuctionStarted", (startTime, endTime) => {
        document.getElementById("auctionStatus").innerText = "Auction Active: Yes";
        updateAuctionStatus();
    });

    contract.on("AuctionEnded", (highestBidder, highestBid) => {
        document.getElementById("auctionStatus").innerText = "Auction Active: No";
        updateAuctionStatus();
    });

    contract.on("BidPlaced", (bidder, amount) => {
        document.getElementById("highestBid").innerText = `Highest Bid: ${ethers.formatEther(amount)} ETH`;
        document.getElementById("highestBidder").innerText = `Highest Bidder: ${bidder}`;
    });
}


// [Cerinta optionala]
// Analiza gas-cost (estimare cost si fixare limita de cost).
async function estimateGasCost(functionName, params = []) {
    try {
        if (!contract) {
            console.error("Contract is not initialized");
            return;
        }

        // Estimez gas-ul necesar pentru executia functiei
        const estimatedGas = await contract[functionName].estimateGas(...params);
        console.log(`Estimated Gas for ${functionName}:`, estimatedGas.toString());

        // Afisez estimarea in UI
        document.getElementById("gasEstimate").innerText = `Estimated Gas: ${estimatedGas}`;

        return estimatedGas;
    } catch (error) {
        console.error(`Error estimating gas for ${functionName}:`, error);
        return null;
    }
}


// Conectare manuala la MetaMask
async function connect() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install MetaMask and try again.");
        return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    const account = await signer.getAddress();
    document.getElementById("account").innerText = `Account: ${account}`;
    const balance = await provider.getBalance(account);
    document.getElementById("balance").innerText = `Balance: ${ethers.formatEther(balance)} ETH`;

    listenForEvents(); // Ascult evenimentele contractului dupa conectare
}

document.getElementById("connect").addEventListener("click", connect);

// Pornire licitatie
async function startAuction() {
    const duration = document.getElementById("duration").value;
    try {
        const tx = await contract.startAuction(duration);
        await tx.wait(); // Astept confirmarea tranzactiei
        alert("Auction started!");
        updateAuctionStatus(); 
    } catch (error) {
        alert(`Error starting auction: ${error.message}`);
    }
}
document.getElementById("startAuction").addEventListener("click", startAuction);


// Plasare licitatie
async function placeBid() {
    const bidAmount = document.getElementById("bidAmount").value;
    try {
		// Estimez costul de gas inainte de tranzactie
        const gasLimit = await estimateGasCost("placeBid");

        const tx = await contract.placeBid({ value: ethers.parseEther(bidAmount), gasLimit: gasLimit ? gasLimit.mul(2) : 300000 });
		
        await tx.wait();
        alert("Bid placed successfully!");
		updateAuctionStatus();
    } catch (error) {
        alert(`Error placing bid: ${error.message}`);
    }
}
document.getElementById("placeBid").addEventListener("click", placeBid);

// Retragere licitatie
async function withdrawBid() {
    try {
        const userAddress = await signer.getAddress(); // Obtine adresa utilizatorului conectat
        
        const tx = await contract.withdrawBid(userAddress); // Trimite adresa utilizatorului ca parametru
        await tx.wait();

        alert("Bid withdrawn successfully!");
        updateAuctionStatus();
    } catch (error) {
        console.error("Error withdrawing bid:", error);
        alert(`Error withdrawing bid: ${error.message}`);
    }
}
document.getElementById("withdrawBid").addEventListener("click", withdrawBid);


// Incheiere licitatie
async function endAuction() {
    try {
        const tx = await contract.endAuction();
        await tx.wait();
        alert("Auction ended!");
    } catch (error) {
        alert(`Error ending auction: ${error.message}`);
    }
}
document.getElementById("endAuction").addEventListener("click", endAuction);

// Actualizare status licitatie
async function updateAuctionStatus() {
    try {
        const highestBid = await contract.getHighestBid();
        const highestBidder = await contract.getHighestBidder();
        document.getElementById("highestBid").innerText = `Highest Bid: ${ethers.formatEther(highestBid)} ETH`;
        document.getElementById("highestBidder").innerText = `Highest Bidder: ${highestBidder}`;
    } catch (error) {
        console.error("Error updating auction status:", error);
    }
}
