import { StatusType } from "@/utilities"

export default {
  data() {
    return {
      StatusType
    }
  },
  computed: {
    statusText() {
      switch (this.getStatus) {
      case StatusType.Approved:
        return "NFT successfully approved!"
      case StatusType.Approving:
        return "Redirecting to Approve NFT"
      case StatusType.Applying:
        return "Applying chosen effect..."
      case StatusType.Unbundling:
        return "Unbundling NFTs..."
      case StatusType.DeployingToIPFS:
        return "Uploading result to IPFS..."
      case StatusType.Minting:
        return "NFT Minting..."
      case StatusType.Minted:
        return "NFT successfully Minted!"
      default:
        return ""
      }
    },
  },
}
