// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title URBANOVA Agentic Pass (UAP) v2
/// @notice Pola mint sama seperti NOMIO: mint() satu panggilan tanpa argumen,
///         harga dibaca dari currentPrice(), dan kontrak memeriksa kepemilikan
///         SPACE ID Agent ID (NFT on-chain milik ekosistem Binance Agentic Wallet)
///         sebelum apa pun. Panggilan dari kontrak lain ditolak.
///         Supply 3.333. 333 pertama free (1 per wallet). Sisanya harga 0 +
///         komisi platform (BNB) yang bisa diatur owner. Mint deploy TERTUTUP.
contract UrbanovaAgenticPassV2 is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 3333;
    uint256 public constant FREE_SUPPLY = 333;

    /// @notice Kontrak NFT SPACE ID Agent ID di BSC ("SPACE ID Agent ID", simbol AI).
    IERC721 public constant AGENT_ID =
        IERC721(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F);

    uint256 public totalMinted;
    uint256 public platformFee; // wei per NFT pada fase berbayar
    uint256 public maxPaidPerWallet = 10;
    bool public mintOpen; // false saat deploy = coming soon

    string private _baseTokenURI;

    mapping(address => bool) public freeClaimed;
    mapping(address => uint256) public paidMintedBy;

    event MintOpenChanged(bool open);
    event PlatformFeeChanged(uint256 fee);
    event BaseURIChanged(string baseURI);

    constructor(
        address initialOwner,
        uint256 initialPlatformFee,
        string memory initialBaseURI
    ) ERC721("URBANOVA Agentic Pass", "UAP") Ownable(initialOwner) {
        platformFee = initialPlatformFee;
        _baseTokenURI = initialBaseURI;
        mintOpen = false;
    }

    /// @notice Harga yang harus dikirim bersama mint() saat ini:
    ///         0 pada fase free, komisi platform pada fase berbayar.
    function currentPrice() public view returns (uint256) {
        return totalMinted < FREE_SUPPLY ? 0 : platformFee;
    }

    /// @notice Apakah sebuah alamat memegang Agent ID.
    function holdsAgentId(address account) public view returns (bool) {
        return AGENT_ID.balanceOf(account) > 0;
    }

    // ---------------- Mint (pola NOMIO: tanpa argumen, 1 NFT per panggilan) ----------------

    function mint() external payable {
        // 1) Gerbang Agent ID — diperiksa sebelum apa pun.
        require(AGENT_ID.balanceOf(msg.sender) > 0, "Wajib memegang Agent ID");
        // 2) Hanya wallet langsung, panggilan dari kontrak lain ditolak.
        require(msg.sender == tx.origin, "Hanya wallet, bukan kontrak");
        // 3) Status & supply.
        require(mintOpen, "Mint belum dibuka");
        require(totalMinted < MAX_SUPPLY, "Supply habis");
        // 4) Nilai harus tepat currentPrice().
        require(msg.value == currentPrice(), "Kirim tepat sebesar currentPrice()");

        if (totalMinted < FREE_SUPPLY) {
            require(!freeClaimed[msg.sender], "Free mint sudah diklaim wallet ini");
            freeClaimed[msg.sender] = true;
        } else {
            require(
                paidMintedBy[msg.sender] < maxPaidPerWallet,
                "Melebihi batas per wallet"
            );
            paidMintedBy[msg.sender] += 1;
        }

        totalMinted += 1;
        _safeMint(msg.sender, totalMinted);
    }

    // ---------------- Owner ----------------

    function setMintOpen(bool open) external onlyOwner {
        mintOpen = open;
        emit MintOpenChanged(open);
    }

    function setPlatformFee(uint256 fee) external onlyOwner {
        platformFee = fee;
        emit PlatformFeeChanged(fee);
    }

    function setMaxPaidPerWallet(uint256 maxQty) external onlyOwner {
        maxPaidPerWallet = maxQty;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIChanged(baseURI);
    }

    /// @notice Tarik seluruh BNB (akumulasi komisi platform) ke owner.
    ///         Selector 0x3ccfd60b — pola yang sama dengan kontrak-kontrak owner lain.
    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "Tidak ada saldo");
        (bool ok, ) = payable(owner()).call{value: bal}("");
        require(ok, "Withdraw gagal");
    }

    // ---------------- View ----------------

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        return bytes(base).length > 0 ? string.concat(base, tokenId.toString()) : "";
    }
}
