const hre = require("hardhat")
const { network } = require("hardhat");

async function main() {
    console.log("")
    console.log("----------------------------------")
    console.log("Deploying Rug Scripty Contracts")
    console.log("----------------------------------")

    // Deploy RugScriptyBuilderV2
    console.log("Deploying RugScriptyBuilderV2...")
    const RugScriptyBuilderV2 = await ethers.getContractFactory("RugScriptyBuilderV2")
    const rugScriptyBuilderV2 = await RugScriptyBuilderV2.deploy()
    await rugScriptyBuilderV2.deployed()
    console.log("RugScriptyBuilderV2 deployed at:", rugScriptyBuilderV2.address)

    // Deploy RugScriptyStorageV2
    console.log("Deploying RugScriptyStorageV2...")
    const RugScriptyStorageV2 = await ethers.getContractFactory("RugScriptyStorageV2")
    const rugScriptyStorageV2 = await RugScriptyStorageV2.deploy()
    await rugScriptyStorageV2.deployed()
    console.log("RugScriptyStorageV2 deployed at:", rugScriptyStorageV2.address)

    // Store deployment addresses in a simple format
    const deploymentInfo = {
        network: network.name,
        rugScriptyBuilderV2: rugScriptyBuilderV2.address,
        rugScriptyStorageV2: rugScriptyStorageV2.address,
        deployedAt: new Date().toISOString()
    }

    console.log("Deployment completed!")
    console.log(JSON.stringify(deploymentInfo, null, 2))

    // Verify contracts if on a network that supports verification
    if (network.name === "sepolia" || network.name === "mainnet") {
        console.log("Waiting for verification...")
        await new Promise(resolve => setTimeout(resolve, 30000))

        try {
            console.log("Verifying RugScriptyBuilderV2...")
            await hre.run("verify:verify", {
                address: rugScriptyBuilderV2.address,
                constructorArguments: []
            })

            console.log("Verifying RugScriptyStorageV2...")
            await hre.run("verify:verify", {
                address: rugScriptyStorageV2.address,
                constructorArguments: []
            })
        } catch (error) {
            console.log("Verification failed:", error.message)
        }
    }

    return deploymentInfo
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
