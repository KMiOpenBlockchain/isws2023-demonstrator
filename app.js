/*********************************************************************************
* The MIT License (MIT)                                                          *
*                                                                                *
* Copyright (c) 2021 KMi, The Open University UK                                 *
*                                                                                *
* Permission is hereby granted, free of charge, to any person obtaining          *
* a copy of this software and associated documentation files (the "Software"),   *
* to deal in the Software without restriction, including without limitation      *
* the rights to use, copy, modify, merge, publish, distribute, sublicense,       *
* and/or sell copies of the Software, and to permit persons to whom the Software *
* is furnished to do so, subject to the following conditions:                    *
*                                                                                *
* The above copyright notice and this permission notice shall be included in     *
* all copies or substantial portions of the Software.                            *
*                                                                                *
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR     *
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,       *
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL        *
* THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER     *
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  *
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN      *
* THE SOFTWARE.                                                                  *
*                                                                                *
**********************************************************************************/

let linkchains = {}
let ethereum = {}
let account = "";

let provider = {};
let signer = {};

let contractcache = {};


/**
 * Initialise buttons clicks, metmask / ethereum etc.
 */
async function initLinkchain() {

	totalTabs = document.getElementById("thedemotabs").getElementsByTagName("li").length;

	// reference linkchains
	linkchains = window.linkchains();
	console.log(linkchains);

	// connect this webpage to ethereum through metamask
	setUpEthereumAndMetamask();

	await selectNetwork();

	// detect change of solid pod url and update various urls stubs and local storage
	const podURLInput = document.getElementById("PodURL");
	podURLInput.onchange = function() {
		let data = this.value;
		if (data == "") {
			data = '<span style="color:gray">Please add Solid Pod URL on tab 1</span>';
		}

		document.getElementById("anchorMetadataStub").innerHTML = data;
		document.getElementById("rdfStub").innerHTML = data;
	};

	/**** WIRE UP BUTTON ON CLICK FUNCTIONS *****/

	const ethereumButton = document.getElementById('enableEthereumButton');
	ethereumButton.onclick = async function() {
		loginToMetaMask();
	};

	/* BUTTONS THAT READ IN A LOCAL FILE */

	const readSolidDataButton = document.querySelector("#readSolidDataButton");
	readSolidDataButton.onclick = async function() {
		const fileURL = document.getElementById("solidFileURL").value;
		const file = await Inrupt.readFileFromPod(fileURL);
		//console.log(file);

		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function() {
			//console.log(reader.result);
			const inputarea = document.getElementById('inputarea');
			inputarea.value = reader.result;
		};
	};

	const readFileDataButton = document.querySelector("#readFileDataButton");
	readFileDataButton.onclick = function() {
		const file = document.getElementById('fileoftriples').files[0];
		document.getElementById('rdfTitle').value = file.name;
		readLocalInputData('fileoftriples', 'inputarea', ['validateGranularRDFInputArea']);
		rdfTitle
	};

	// Granular Validation
	const validateGranularRDFInputButton = document.querySelector("#validateGranularRDFInputButton");
	validateGranularRDFInputButton.onclick = async function() {
		readLocalInputData('validateGranularRDFInputFile', 'validateGranularRDFInputArea', []);
	};

	const granularMetadataValidationInputButton = document.querySelector("#granularMetadataValidationInputButton");
	granularMetadataValidationInputButton.onclick = async function() {
		readLocalInputData('granularMetadataValidationInputFile', 'granularMetadataValidationInputArea', []);
	};

	/* LINKCHAIN RELATED BUTTONS */
	const anchorMetadataButton = document.getElementById('anchorMetadataButton');
	anchorMetadataButton.onclick = function() {
		anchorMetadata();
	};

	const validateGranularButton = document.getElementById('validateGranularButton');
	validateGranularButton.onclick = function() {
		validateGranular();
	};

	//const clearButton = document.getElementById('clearButton');
	//clearButton.onclick = function() {
	//	clearAll();
	//};

	/* NAVIGATION BUTTONS */

	const nextButton = document.getElementById('ntxbtn');
	nextButton.onclick = function(e) {
		try {
			e.preventDefault();

			const acollection = document.getElementsByClassName("nav-link active"); // currently active tab anchor - should only be 1
			const currentLi = acollection[0].parentElement;
			const nextLi = currentLi.nextElementSibling;
			const nodes = Array.prototype.slice.call( document.getElementById('thedemotabs').children );
			currentTab = nodes.indexOf(currentLi);
			currentTab +=1;

			if (nextLi != null) {
				nextLi.firstElementChild.click();
			}

			showHideControls();
		} catch (error) {
			console.log(e);
		}
	};

	const previousButton = document.getElementById('prevbtn');
	previousButton.onclick = function(e) {

		try {
			e.preventDefault();

			const acollection = document.getElementsByClassName("nav-link active"); // currently active tab anchor - should only be 1
			const currentLi = acollection[0].parentElement;
			const previousLi = currentLi.previousElementSibling;
			const nodes = Array.prototype.slice.call( document.getElementById('thedemotabs').children );
			currentTab = nodes.indexOf(previousLi);
			currentTab -=1;

			if (previousLi != null) {
				previousLi.firstElementChild.click();
			}

			showHideControls();
		} catch (error) {
			console.log(e);
		}
	};


	/* INRUPT/SOLID RELATED BUTTONS */

	/* Tab to connect to Solid and view files */

	const solidLoginButton = document.querySelector("#solidLoginButton");
	solidLoginButton.onclick = function() {
		const oidcIssuerUrl = document.getElementById("oidcIssuer").value;
		if (oidcIssuerUrl == null || oidcIssuerUrl == "") {
			alert("Please add the url of where to login to your Solid pod");
		} else {
			Inrupt.startSolidLogin(oidcIssuerUrl, "ISWS Summer School Demo - 2023", window.location.href);
		}
	};

	const solidLogoutButton = document.querySelector("#solidLogoutButton");
	solidLogoutButton.onclick = function() {
		Inrupt.solidLogout();
	};

	const readFileFromSolidButton = document.querySelector("#readFileFromSolidButton");
	readFileFromSolidButton.onclick = async function() {
		try {
			const podUrl = document.getElementById("PodURL").value;
			const allFolderArray = await Inrupt.loadFolderContentList(podUrl);

			const filesArea = document.getElementById("filesArea");
			let allFiles = ""
			allFolderArray.forEach(function(filename) {
				allFiles += filename+'\n';
			});

			filesArea.value = allFiles;

		} catch (error) {
			console.log(error);
			alert(error.message);
		}
	};


	/* Button to save a file of rdf input data to Solid */

	const saveFileDataButton = document.querySelector("#saveFileDataButton");
	saveFileDataButton.onclick = async function() {
		try {
			const data = document.getElementById("inputarea").value;
			if (data == "") {
				alert("Please load some data into the textarea to store to solid");
				return;
			}
			const title =  document.getElementById("rdfTitle").value;
			if (title == "") {
				alert("Please enter a filename to use in Solid");
				return;
			}

			const filename = title.replace(/[^\-a-z0-9.]/gi, '_').toLowerCase();
			const pathToStore = document.getElementById("PodURL").value+filename;
			const filetype = 'text/plain'; // must be this or fails - no idea why
			const blob = new Blob([data], { type: filetype });
			const file = new File([blob], filename, { type: filetype });
			const fileurl = await Inrupt.writeFileToPod(file, pathToStore);

			document.getElementById("rdfSolidURLResult").innerHTML = fileurl;
		} catch (error) {
			console.log(error);
			alert(error.message);
		}
	}

	/* Button to stored Anchored Metadata to Solid */

	const storeAnchorMetadataButton = document.querySelector("#storeAnchorMetadataButton");
	storeAnchorMetadataButton.onclick = async function() {
		try {
			const data = document.getElementById("anchorMetadataResult").value;
			if (data == "") {
				alert("Please load some data into the textarea to store to solid");
				return;
			}
			const title =  document.getElementById("anchorMetadataTitle").value;
			if (title == "") {
				alert("Please give this results metadata a title to use in Solid");
				return;
			}

			const filename = title.replace(/[^\-a-z0-9]/gi, '_').toLowerCase();
			const pathToStore = document.getElementById("PodURL").value+filename+'.jsonld';
			const filetype = 'text/plain'; // must be this or fails - no idea why
			const blob = new Blob([data], { type: filetype });
			const file = new File([blob], filename, { type: filetype });
			const fileurl = await Inrupt.writeFileToPod(file, pathToStore);

			document.getElementById("anchorMetadataSolidURLResult").innerHTML = fileurl;
			document.getElementById("anchoredMetadataInputURL").value = fileurl;
		} catch (error) {
			console.log(error);
			alert(error.message);
		}
	};

	/* Tab to Validate with Granular metadata */

	const readValidateGranularRDFInputButton = document.querySelector("#readValidateGranularRDFInputButton");
	readValidateGranularRDFInputButton.onclick = async function() {
		const fileURL = document.getElementById("validateGranularRDFInputURL").value;
		const file = await Inrupt.readFileFromPod(fileURL);

		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function() {
			const inputarea = document.getElementById('validateGranularRDFInputArea');
			inputarea.value = reader.result;
		};
	}


	const readGranularMetadataValidationButton = document.querySelector("#readGranularMetadataValidationButton");
	readGranularMetadataValidationButton.onclick = async function() {
		const fileURL = document.getElementById("validateGranularMetadataInputURL").value;
		const file = await Inrupt.readFileFromPod(fileURL);

		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function() {
			const inputarea = document.getElementById('granularMetadataValidationInputArea');
			inputarea.value = reader.result;
		};
	}
}

/**
 * Setup ethereum and metmask.
 */
async function setUpEthereumAndMetamask() {

	try {
		ethereum = window.ethereum;

		// A Web3Provider wraps a standard Web3 provider, which is
		// what MetaMask injects as window.ethereum into each page
		provider = new ethers.providers.Web3Provider(window.ethereum)
		console.log('provider:', provider);

		// The MetaMask plugin also allows signing transactions to
		// send ether and pay to change state within the blockchain.
		// For this, you need the account signer...
		signer = provider.getSigner();
		console.log('signer:', signer);

		// Check if logged into MetaMask already
		if (typeof ethereum !== 'undefined') {

			// detect Network change and reassign provider and signer, and reselect contract
			ethereum.on('chainChanged', async function() {
				provider = new ethers.providers.Web3Provider(window.ethereum)
				console.log('provider:', provider);
				signer = provider.getSigner();
				console.log('signer:', signer);
				await selectNetwork();
			});

			// detect an account change
			ethereum.on("accountsChanged", () => {
				if (account != ethereum.selectedAddress) {
					account = ethereum.selectedAddress;
					document.getElementById('ethereumaccount').innerHTML = account;
				}
			});

			if (ethereum.isMetaMask) {
				console.log('MetaMask is installed');
			}

			console.log("ethereum.networkVersion: " + ethereum.networkVersion);
			console.log("ethereum.selectedAddress: " + ethereum.selectedAddress);

			if (ethereum.selectedAddress == "" || ethereum.selectedAddress == null) {
				const button = document.getElementById('enableEthereumButton');
				button.disabled = false;
			} else {
				const button = document.getElementById('enableEthereumButton');
				button.disabled = true;
				enableMetaMaskButtons();
				account = ethereum.selectedAddress;
				document.getElementById('ethereumaccount').innerHTML = account;
			}
		} else {
			const button = document.getElementById('enableEthereumButton');
			button.disabled = false;
			console.log('MetaMask needs to be installed');
		}
	} catch (e) {
		throw e;
	}
}

/**
 * Start the metamask extension for user to login.
 */
async function loginToMetaMask() {

	let reply = await ethereum.request({ method: 'eth_requestAccounts' });

	if (ethereum.selectedAddress) {
		const button = document.getElementById('enableEthereumButton');
		button.disabled = true;

		enableMetaMaskButtons();

		await selectNetwork();

		account = ethereum.selectedAddress;
		document.getElementById('ethereumaccount').innerHTML = account;
	} else {
		alert("Please select a MetaMask account to use with this page");
	}
}

/**
 * Change the selected network on the Token issuing tab selection menu.
 */
async function selectNetwork() {
	try {
		const networkSelect = document.getElementById('networks');

		const currentNetwork = await getNetwork();
		const networkName = currentNetwork.name;
		const matchName = networkName.charAt(0).toUpperCase() + networkName.slice(1);
	} catch (e) {
		// just show the two there are, with non selected.
		console.log(e);
	}
}

/**
 * Ask MetaMask for the details of the current network selected.
 */
async function getNetwork() {
	try {
		// get the chain id of the current blockchain your wallet is pointing at.
		const chainId = await signer.getChainId();
		//console.log(chainId);

		// get the network details for the given chain id.
		const network = await provider.getNetwork(chainId);
		//console.log(network);

		return network;
	} catch (e) {
		throw e;
	}
}

/**
 * Ask MetaMask to switch to the network in the networkObj passed in.
 */
async function switchNetwork(networkObj) {
	try {
		let chainId = networkObj.chainId;
		chainId = parseInt(chainId);
		const hexChainId = ethers.utils.hexValue(chainId);

		await ethereum.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: hexChainId}],
		});

		provider = new ethers.providers.Web3Provider(window.ethereum)
		console.log('provider:', provider);
		signer = provider.getSigner();
		console.log('signer:', signer);
		await selectNetwork();

	} catch (switchError) {
		// This error code indicates that the chain has not been added to MetaMask.
		console.log(switchError);
		if (switchError.code === 4902) {
			throw new Error("The required network is not available in your MetaMask, please add: "+networkObj.name);
		} else {
			throw new Error("Failed to switch to the network");
		}
	}
}

/**
 * Load RDF data from select file
 */
async function readLocalInputData(filefieldname, inputareaname, prefillAreasArray) {

	var filefield = document.getElementById(filefieldname);
	if (filefield) {
		var file = filefield.files[0];
		if (file) {
			var reader = new FileReader();

			reader.addEventListener("load", async () => {
				let input = reader.result;

				const inputarea = document.getElementById(inputareaname);
				inputarea.value = input;

				prefillAreasArray.forEach(function(elementname) {
					const nextelement = document.getElementById(elementname);
					nextelement.value = input;
				});
			}, false);

			reader.addEventListener('error', () => {
				console.error(`Error occurred reading file: ${file.name}`);
			});

			reader.readAsText(file);
		} else {
			alert("Please select a file first");
		}
	} else {
		alert("Please select a file first");
	}
}

/**
 * Helper function to help linkchains verify function read from the blockchain
 */
async function readMerQLAnchorContract(anchor, option) {

	//anchor.type
	//anchor.address
	//anchor.account
	//anchor.transactionhash

	console.log("Anchor:");
	console.log(anchor);

	const currentNetwork = await getNetwork();
	delete currentNetwork._defaultProvider; // we don't want that bit

	if (anchor.network && anchor.network.name != currentNetwork.name) {
		//alert("Please switch networks. This data was anchored on: "+anchor.network.name);
		//throw new Error("Wrong network detected to validate against");
		await switchNetwork(anchor.network);
	}

	contractAddress = anchor.address;

	// check if it cached first
	if (contractcache[contractAddress] !== undefined) {
		return contractcache[contractAddress];
	}

	const validateResult = document.getElementById('validateResult');
	const abi = cfg.MerQLAnchorContract.abi;

	try {
		const theContract = new ethers.Contract(contractAddress, abi, provider);
		let data = await theContract.getData();

		// this is needed as the returned data object is sort of an array - despite what this code may imply.
		const dataObj = {
			leastSignificants: parseInt(data.leastSignificants.toString()),
			theCreationTime: data.theCreationTime.toString(),
			theDivisor: parseInt(data.theDivisor.toString()),
			theIndexHashFunction: data.theIndexHashFunction.toString(),
			theIndexType: data.theIndexType.toString(),
			theOwner: data.theOwner.toString(),
			theQuadHashFunction: data.theQuadHashFunction.toString(),
			theTreeHashFunction: data.theTreeHashFunction.toString(),
			thetargetHash: data.thetargetHash.toString(),
		}

		// get the transaction
		const receipt = await provider.getTransactionReceipt(anchor.transactionHash);
		dataObj.transactionAccount = receipt.from;
		dataObj.transactionContractAddress = receipt.contractAddress;

		// add the network to the reply.
		if (anchor.network) {
			dataObj.network = anchor.network;
		}

		contractcache[contractAddress] = dataObj;

		return dataObj;

	} catch (e) {
		console.log(e);
		validateResult.value = e;
	}
}

/**
 * Helper function to help linkchains anchorMetadata function write to the blockchain and use MetaMask to sign the transaction
 */
async function deployMerQLAnchorContract(anchor, options) {

	const anchorMetadataResult = document.getElementById('anchorMetadataResult');
	const abi = cfg.MerQLAnchorContract.abi;
	const bytecode = cfg.MerQLAnchorContract.bytecode;

	try {
		const currentNetwork = await getNetwork();
		delete currentNetwork._defaultProvider; // we don't want that bit

		const factory = new ethers.ContractFactory(abi, bytecode, signer);

		var indexHash = anchor.indexhash;
		var newIndexType = anchor.settings.indexType; //following lines take their values from merkleOutput too
		var lsds = anchor.settings.lsd;
		var div = ""+anchor.settings.divisor; // because it needs to be a string in the smart contract, not a number.
		var quadHashFunctionIn = anchor.settings.quadHash;
		var treeHashFunctionIn = anchor.settings.treeHash;
		var indexHashFunctionIn = anchor.settings.indexHash;

		var contractArgs = [
			indexHash,
			newIndexType,
			lsds,
			div,
			quadHashFunctionIn,
			treeHashFunctionIn,
			indexHashFunctionIn,
		];

		const contract = await factory.deploy(contractArgs[0],contractArgs[1],contractArgs[2],contractArgs[3],contractArgs[4],contractArgs[5],contractArgs[6]);

		anchorMetadataResult.value = "Waiting to be mined....";

		const receipt = await contract.deployTransaction.wait();

		const result = {
			address: receipt.contractAddress,
			account: account,
			transactionHash: receipt.transactionHash,
			network: currentNetwork
		};

		return Object.assign(anchor, result);

	} catch (e) {
		console.log(e);
		anchorMetadataResult.value = e;
		throw(e);
	}
}

/**
 * Call linkchains to put the verification Metadata on the blockchain in a smart contract
 */
async function anchorMetadata() {

	var element = document.getElementById("holder");
	element.classList.add("wait");

	try {
		const inputarea = document.getElementById('inputarea');
		let rdfInputData = inputarea.value;

		const anchorMetadataResult = document.getElementById('anchorMetadataResult');
		anchorMetadataResult.value = "Depending on the input size, this can take a while. Please wait while processing..."

		let anchoredMetadata = "";
		if (rdfInputData != "" && rdfInputData != null) {
			const verificationMetadata = await linkchains.getVerificationMetadata(rdfInputData, {});

			const options = {}; // requires no additional options as it is using the default Linkchain MerQL Contract way of anchoring
			const anchoredMetadata = await linkchains.anchorMetadata(verificationMetadata, options, deployMerQLAnchorContract);
			const granularMetadata = await linkchains.getGranularVerificationMetadata(rdfInputData, anchoredMetadata);

			const fullMetadata = {
				"granular": granularMetadata,
				"full": anchoredMetadata
			};

			anchorMetadataResult.value = JSON.stringify(fullMetadata, null, 2);
		} else {
			alert("Please select a file of RDF To anchor");
		}
	} catch (error) {
		console.log(error);
		anchorMetadataResult.value = error.message;
	}

	element.classList.remove("wait");
}

/**
 * Call linkchains to get more detailed the verification Metadata
 */
async function getGranularVerificationMetadata() {

	const granularVerificationMetadataResult = document.getElementById('granularVerificationMetadataResult');

	try {
		const inputarea = document.getElementById('anchoredRDFInputArea');
		let rdfInputData = "";
		if (inputarea.value != "" && inputarea.value != null) {
			rdfInputData = inputarea.value;
		} else {
			alert("Please load the RDF to get granular verification metadata for");
			return;
		}

		const anchoredMetadata = document.getElementById('anchoredMetadataInputArea');
		let anchoredData = "";
		if (anchoredMetadata.value != "" && anchoredMetadata.value != null) {
			anchoredData = anchoredMetadata.value
		} else {
			alert("Please load the anchored metadata to get granular metadata for");
			return;
		}

		granularVerificationMetadataResult.value = "Depending on the input size, this can take a while. Please wait while processing..."

		const granularMetaData = await linkchains.getGranularVerificationMetadata(rdfInputData, anchoredData);

		granularVerificationMetadataResult.value = JSON.stringify(granularMetaData, null, 2);

		// prefill the validate granular metadata input area
		const granularMetadataValidationInputArea = document.getElementById('granularMetadataValidationInputArea');
		granularMetadataValidationInputArea.value = JSON.stringify(granularMetaData, null, 2);

	} catch (error) {
		console.log(error);
		granularVerificationMetadataResult.value = error.message;
	}
}

/**
 * Call linkchains validate with granular metadata
 */
async function validateGranular() {

	let options = {}
	const validateGranularResult = document.getElementById('validateGranularResult');

	try {
		const validateGranularRDFInputArea = document.getElementById('validateGranularRDFInputArea');
		let rdfInputData = "";
		if (validateGranularRDFInputArea.value != "" && validateGranularRDFInputArea.value != null) {
			rdfInputData = validateGranularRDFInputArea.value;
		} else {
			alert("Please load the RDF to validate");
			return;
		}

		const granularMetadataValidationInputArea = document.getElementById('granularMetadataValidationInputArea');
		let granularMetaData = "";
		if (granularMetadataValidationInputArea.value != "" && granularMetadataValidationInputArea.value != null) {
			granularMetaData = granularMetadataValidationInputArea.value
		} else {
			alert("Please load the anchored metadata to use for validation");
			return;
		}

		const handler = async function(anchor, options) {
			let reply = "";
			if (anchor.type == "ETHMerQL") {
				reply = await readMerQLAnchorContract(anchor, options);
			}
			console.log(reply);

			return reply;
		}

		validateGranularResult.value = "Depending on the input size, this can take a while. Please wait...";

		const output = await linkchains.verify(rdfInputData, granularMetaData, options, handler);

		validateGranularResult.value = JSON.stringify(output, null, 2);

	} catch (e) {
		console.log(e);
		validateGranularResult.value = e.message;
	}
}

/**
 * Enables metamask relatyed buttons after attached to metamask
 */
function enableMetaMaskButtons() {

	const anchorMetadataButton = document.getElementById('anchorMetadataButton'); // write to blockchain
	anchorMetadataButton.disabled = false;
	const validateGranularButton = document.getElementById('validateGranularButton'); // read from blockchain?
	validateGranularButton.disabled = false;
}

function enableSolidButtons() {

	/** Tab to connect to Solid and view files **/
	const solidLoginButton = document.querySelector("#solidLoginButton");
	solidLoginButton.disabled=true;

	const solidLogoutButton = document.querySelector("#solidLogoutButton");
	solidLogoutButton.disabled=false;

	const readFileFromSolidButton = document.querySelector("#readFileFromSolidButton");
	readFileFromSolidButton.disabled=false;

	/** Tab to get Verification Metadata for some RDF Input **/
	const saveFileDataButton = document.querySelector("#saveFileDataButton");
	saveFileDataButton.disabled=false;
	const readSolidDataButton = document.querySelector("#readSolidDataButton");
	readSolidDataButton.disabled=false;
	const storeAnchorMetadataButton = document.querySelector("#storeAnchorMetadataButton");
	storeAnchorMetadataButton.disabled=false;

	/** Tab to Validate with Granular metadata **/
	const readValidateGranularRDFInputButton = document.querySelector("#readValidateGranularRDFInputButton");
	readValidateGranularRDFInputButton.disabled=false;
	const readGranularMetadataValidationButton = document.querySelector("#readGranularMetadataValidationButton");
	readGranularMetadataValidationButton.disabled=false;

}

function disableSolidButtons() {


	document.querySelector("#solidpod").innerHTML="";
	const solidLogoutButton = document.querySelector("#solidLogoutButton");
	solidLogoutButton.disabled=true;

	/** Tab to connect to Solid and view files **/
	const solidLoginButton = document.querySelector("#solidLoginButton");
	solidLoginButton.disabled=false;

	const readFileFromSolidButton = document.querySelector("#readFileFromSolidButton");
	readFileFromSolidButton.disabled=true;

	/** Tab to Anchor Verification Metadata to the Blockchain **/
	const saveFileDataButton = document.querySelector("#saveFileDataButton");
	saveFileDataButton.disabled=true;

	const readSolidDataButton = document.querySelector("#readSolidDataButton");
	readSolidDataButton.disabled=true;

	const storeAnchorMetadataButton = document.querySelector("#storeAnchorMetadataButton");
	storeAnchorMetadataButton.disabled=true;

	/** Tab to Validate with Granular metadata **/
	const readValidateGranularRDFInputButton = document.querySelector("#readValidateGranularRDFInputButton");
	readValidateGranularRDFInputButton.disabled=true;
	const readGranularMetadataValidationButton = document.querySelector("#readGranularMetadataValidationButton");
	readGranularMetadataValidationButton.disabled=true;

}


function clearAll() {

	//Get Verification Metadata for some RDF Input
	document.getElementById('solidFileURL').value = "";
	document.getElementById('inputarea').value = "";
	document.getElementById('verificationMetadataResult').value = "";
	document.getElementById('verificationMetadataTitle').value = "";
	document.getElementById('verificationMetadataSolidURLResult').innerHTML = "";

	// Anchor Verification Metadata to the Blockchain with a Contract
	document.getElementById('anchorMetadataResult').value = "";
	document.getElementById('anchorMetadataTitle').value = "";
	document.getElementById('anchorMetadataSolidURLResult').innerHTML = "";

		// Validate RDF Data - Granular
	document.getElementById('validateGranularRDFInputURL').value = "";
	document.getElementById('validateGranularRDFInputArea').value = "";
	document.getElementById('validateGranularMetadataInputURL').value = "";
	document.getElementById('granularMetadataValidationInputArea').value = "";
	document.getElementById('validateGranularResult').value = "";
}

// Forward and Back buttons

var totalTabs = 0;
var currentTab = 0;

function tabClick() {
	const acollection = document.getElementsByClassName("nav-link active"); // currently active tab anchor - should only be 1
	const currentLi = acollection[0].parentElement;
	const nodes = Array.prototype.slice.call( document.getElementById('thedemotabs').children );
	currentTab = nodes.indexOf(currentLi);
	showHideControls();
}

function showHideControls(){

	const nextButton = document.getElementById('ntxbtn');
	const previousButton = document.getElementById('prevbtn');

	previousButton.style.display = "inline-block";
	nextButton.style.display = "inline-block";

	if (currentTab == 0){
		previousButton.style.display = "none";
	}
	if (currentTab == (totalTabs-1)){
		nextButton.style.display = "none";
	}
}
