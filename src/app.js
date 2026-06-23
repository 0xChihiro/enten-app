import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  encodeFunctionData,
  formatUnits as viemFormatUnits,
  http,
  keccak256,
  parseAbi,
  parseUnits as viemParseUnits,
  stringToHex
} from "./viem-runtime.js";

(function () {
  "use strict";

  var PAGE_KIND = __ENTEN_PAGE__;
  var IS_AUCTION_PAGE = PAGE_KIND === "auction";
  var IS_BORROW_PAGE = PAGE_KIND === "borrow";
  var IS_LAUNCH_PAGE = PAGE_KIND === "launch";
  var IS_PRESALE_PAGE = PAGE_KIND === "presale";
  var IS_SWAP_PAGE = PAGE_KIND === "swap";
  var IS_WALLET_PAGE = PAGE_KIND === "wallet";

  function cleanupLocalServiceWorker() {
    var host = window.location.hostname;
    var isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";

    if (!isLocalHost || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        registrations.forEach(function (registration) {
          registration.unregister();
        });
      })
      .catch(function () {
        /* Best-effort cleanup for stale local preview workers. */
      });

    if ("caches" in window) {
      window.caches
        .keys()
        .then(function (keys) {
          return Promise.all(
            keys.map(function (key) {
              return window.caches.delete(key);
            })
          );
        })
        .catch(function () {
          /* Cache deletion can be blocked in private browsing contexts. */
        });
    }
  }

  cleanupLocalServiceWorker();

  var SUPPORTED_CHAINS = {
    "0x10e6": {
      chainId: "0x10e6",
      chainName: "MegaETH",
      shortName: "MegaETH",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      },
      rpcUrls: ["https://mainnet.megaeth.com/rpc"],
      blockExplorerUrls: ["https://megaeth.blockscout.com"],
      chainIdDecimal: 4326,
      multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
      uniswap: {
        universalRouter: "0x47837eb80db5908eabba9105626d9b348bea7b02",
        weth: "0x4200000000000000000000000000000000000006",
        universalRouterVersion: "2.0",
        routeApiUrl: "",
        protocols: ["V2", "V3", "V4"],
        routingPreference: "BEST_PRICE",
        slippageTolerance: 0.5
      },
      tokens: {
        enten: {
          id: "ENTEN",
          address: "0x0234059A118E0B7953252189e028ea7E780BbeE1",
          symbol: "ENTEN",
          name: "Enten",
          decimals: 18
        },
        quotes: [
          {
            id: "MEGA",
            address: "0x28B7E77f82B25B95953825F1E3eA0E36c1c29861",
            symbol: "MEGA",
            name: "Mega",
            decimals: 18
          },
          {
            id: "USDM",
            address: "0xfafddbb3fc7688494971a79cc65dca3ef82079e7",
            symbol: "USDm",
            name: "MegaUSD",
            decimals: 18
          }
        ]
      },
      auction: {
        address: "",
        vaultAddress: "0x0E30e29e064f22fF434E3617C9EcB9A7a09EC189",
        mintDecimals: 18,
        deadlineSeconds: 1200,
        maxPayments: []
      },
      presale: {
        address: "0x1c54Fd960b761960A4265AE49603a338995e19e6",
        controllerAddress: "0x6cd36ee52e83f88201b97914a8f574b922b69360",
        kernelAddress: "0x198ce3da5a8f9cd79c474887a7318ca42919e687",
        assetId: "MEGA",
        mintDecimals: 18,
        deadlineSeconds: 1200,
        maxPaymentBufferBps: 0
      },
      borrow: {
        address: "0x1c86024bE1F892A17C995c002564BA865612eCaE",
        controllerAddress: "0x6cd36ee52e83f88201b97914a8f574b922b69360",
        kernelAddress: "0x198ce3da5a8f9cd79c474887a7318ca42919e687",
        assetId: "MEGA"
      },
      kumbaya: {
        quoterV2: "0x1F1a8dC7E138C34b503Ca080962aC10B75384a27",
        // Kumbaya SwapRouter02 (Uniswap V3 style). Confirmed on-chain: factory ===
        // QuoterV2 factory, WETH9 set, V3-only (no factoryV2). It quotes via eth_call
        // simulation and executes exactInputSingle / exactInput.
        swapRouter: "0xe5bbef8de2db447a7432a47eba58924d94ee470e",
        usdToken: {
          address: "0xfafddbb3fc7688494971a79cc65dca3ef82079e7",
          symbol: "USDm",
          decimals: 18
        },
        feeTiers: [100, 500, 3000, 10000],
        circulatingSupply: 1000000,
        fdvSupply: 10000000
      },
      controllerFactory: {
        address: "0x8a611673c6d7faB8C24b10cDEC62902241B06751"
      }
    },
    "0x18c7": {
      chainId: "0x18c7",
      chainName: "MegaETH Testnet",
      shortName: "MegaETH Testnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      },
      rpcUrls: ["https://carrot.megaeth.com/rpc"],
      blockExplorerUrls: ["https://megaeth-testnet-v2.blockscout.com"],
      chainIdDecimal: 6343,
      multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
      uniswap: {
        universalRouter: "",
        weth: "",
        universalRouterVersion: "2.0",
        routeApiUrl: "",
        protocols: ["V2", "V3", "V4"],
        routingPreference: "BEST_PRICE",
        slippageTolerance: 0.5
      },
      tokens: {
        enten: {
          id: "ENTEN",
          address: "0x67Ba1DC9c12933Cf9F68FDd0d4600aCb2078564a",
          symbol: "ENTEN",
          name: "Enten",
          decimals: 18
        },
        quotes: [
          {
            id: "ETH",
            address: "native",
            symbol: "ETH",
            name: "MegaETH Testnet Ether",
            decimals: 18,
            native: true
          },
          {
            id: "MEGA",
            address: "0xc903c68C1d389CEd76fEe0349067a4295828e6c2",
            symbol: "MEGA",
            name: "Mega",
            decimals: 18
          },
          {
            id: "USDM",
            address: "0x72d4db19E3AE6f8ed47B5337ab00D69685277cF4",
            symbol: "USDm",
            name: "MegaUSD",
            decimals: 18
          }
        ]
      },
      auction: {
        address: "0xAd16d09D1e748b0344E16FfE09Fe1d1485d29543",
        vaultAddress: "0x3D22b11c966Eaa12e0eEe672C3119Df72AA708ef",
        mintDecimals: 18,
        deadlineSeconds: 1200,
        maxPayments: []
      },
      presale: {
        address: "0x729A279137F12ED319ad07B20A308885Ae467d6F",
        mintDecimals: 18,
        deadlineSeconds: 1200,
        maxPaymentBufferBps: 0
      },
      borrow: {
        // BorrowPolicy is not deployed yet — set this once it is to enable the page.
        address: "",
        assetId: "MEGA"
      },
      controllerFactory: {
        address: "0x99A6f2f41e585029Ed7dbEAc7953FCD6F5997306"
      }
    }
  };

  var DEFAULT_CHAIN_ID = "0x10e6"; // MegaETH Mainnet (4326). Testnet (0x18c7) stays selectable.
  var PREFERRED_CHAIN_KEY = "enten.preferredChainId";
  var NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
  var SWAP_TRADING_ENABLED = true;
  var SWAP_UNAVAILABLE_MESSAGE = "Swaps are only available on MegaETH mainnet right now.";

  var ERC20_ABI = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ]);

  var AUCTION_ABI = parseAbi([
    "function getPrice() view returns ((address token, uint256 amount)[])",
    "function remainingLot() view returns (uint256)",
    "function LOT_SIZE() view returns (uint256)",
    "function startTime() view returns (uint256)",
    "function epochPeriod() view returns (uint256)",
    "function epochId() view returns (uint256)",
    "function buy(uint256 epochId, uint256 deadline, uint256 mintAmount, (address token, uint256 amount)[] maxPayments)",
    "function startNextAuction()"
  ]);

  var PRESALE_AUCTION_ABI = parseAbi([
    "function ADMIN() view returns (address)",
    "function ASSET() view returns (address)",
    "function CONTROLLER() view returns (address)",
    "function DURATION() view returns (uint256)",
    "function MIN_BID() view returns (uint256)",
    "function PRESALE_SIZE() view returns (uint256)",
    "function START_PRICE() view returns (uint256)",
    "function TOKEN() view returns (address)",
    "function VIRTUAL_TOKEN_RESERVE() view returns (uint256)",
    "function buy(uint256 amount, uint256 maxPayment, uint256 deadline)",
    "function buyMax(uint256 maxPayment, uint256 deadline)",
    "function currentPremium() view returns (uint256)",
    "function isActive() view returns (bool)",
    "function lastPriceUpdate() view returns (uint256)",
    "function minimumPrice() view returns (uint256)",
    "function open()",
    "function premiumInitialized() view returns (bool)",
    "function price() view returns (uint256)",
    "function quote(uint256 amount) view returns (uint256 payment, uint256 spotPrice, uint256 nextPremium)",
    "function remaining() view returns (uint256)",
    "function sold() view returns (uint256)",
    "function startTime() view returns (uint256)",
    "function totalCommitted() view returns (uint256)"
  ]);

  var VAULT_ABI = parseAbi(["function backingBalances() view returns ((address token, uint256 amount)[])"]);
  var CONTROLLER_VIEW_ABI = parseAbi(["function VAULT() view returns (address)"]);
  var KERNEL_VIEW_ABI = parseAbi(["function viewData(bytes32[] slots) view returns (bytes32[])"]);

  // Kernel namespaces used by the protocol's backingPerToken helper. The two
  // asset-specific values are stored at keccak256(abi.encode(namespace, asset)).
  var BACKING_AMOUNT_SLOT = keccak256(stringToHex("enten.vault.backing.amount"));
  var ASSET_TOTAL_BORROWED_SLOT = keccak256(stringToHex("enten.borrow.asset.borrowed"));
  var TEAM_LOCKED_TOKENS_SLOT = keccak256(stringToHex("enten.team.locked.tokens"));
  var WAD = 10n ** 18n;

  // BorrowPolicy (enten-periphery). Collateralized, interest-free borrowing of backing
  // assets against deposited ENTEN. `Receipt` is the {asset, amount} tuple used across
  // borrow/repay; `userPosition` returns the caller's collateral and per-asset debt.
  var BORROW_POLICY_ABI = parseAbi([
    "function CONTROLLER() view returns (address)",
    "function KERNEL() view returns (address)",
    "function TOKEN() view returns (address)",
    "function isActive() view returns (bool)",
    "function deposit(uint256 amount)",
    "function withdraw(uint256 amount)",
    "function borrow((address asset, uint256 amount)[] receipts)",
    "function borrowMax()",
    "function depositAndBorrow(uint256 amount, (address asset, uint256 amount)[] assets)",
    "function repay((address asset, uint256 amount)[] receipts)",
    "function repayAll()",
    "function repayAndWithdraw((address asset, uint256 amount)[] assets, uint256 amount)",
    "function borrowable(address user) view returns ((address asset, uint256 amount)[])",
    "function borrowableAssets() view returns (address[])",
    "function borrowableForAsset(address user, address asset) view returns (uint256)",
    "function maxBorrowForAsset(address user, address asset) view returns (uint256)",
    "function currentDebtForAsset(address user, address asset) view returns (uint256)",
    "function totalCollateral(address asset) view returns (uint256)",
    "function userPosition(address user) view returns ((uint256 collateral, (address asset, uint256 amount)[] debt) position)"
  ]);

  // Kumbaya QuoterV2 (Uniswap V3 style). The quote functions are nonpayable on-chain but are
  // designed to be invoked via eth_call, so we declare them view to read them with readContract.
  var QUOTER_V2_ABI = parseAbi([
    "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) view returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
    "function quoteExactInput(bytes path, uint256 amountIn) view returns (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)"
  ]);

  // Kumbaya SwapRouter02 (Uniswap swap-router-contracts variant — note the structs
  // have NO deadline field; deadlines are only available via the multicall overload).
  var SWAP_ROUTER_ABI = parseAbi([
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
    "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum) params) payable returns (uint256 amountOut)"
  ]);

  var CONTROLLER_FACTORY_ABI = [
    {
      type: "function",
      name: "totalControllers",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }]
    },
    {
      type: "function",
      name: "predictDeployment",
      stateMutability: "view",
      inputs: [
        { name: "deployer", type: "address", internalType: "address" },
        { name: "salt", type: "bytes32", internalType: "bytes32" }
      ],
      outputs: [
        {
          name: "deployment",
          type: "tuple",
          internalType: "struct IControllerFactory.Deployment",
          components: [
            { name: "controller", type: "address", internalType: "address" },
            { name: "kernel", type: "address", internalType: "address" },
            { name: "vault", type: "address", internalType: "address" },
            { name: "token", type: "address", internalType: "address" },
            { name: "teamLocker", type: "address", internalType: "address" }
          ]
        }
      ]
    },
    {
      type: "function",
      name: "launchController",
      stateMutability: "nonpayable",
      inputs: [
        { name: "admin", type: "address", internalType: "address" },
        { name: "salt", type: "bytes32", internalType: "bytes32" },
        {
          name: "config",
          type: "tuple",
          internalType: "struct IControllerFactory.LaunchConfig",
          components: [
            { name: "tokenName", type: "string", internalType: "string" },
            { name: "tokenSymbol", type: "string", internalType: "string" },
            { name: "preMineAddress", type: "address", internalType: "address" },
            { name: "preMineAmount", type: "uint256", internalType: "uint256" },
            { name: "teamTokenAmount", type: "uint256", internalType: "uint256" },
            { name: "maxSupply", type: "uint256", internalType: "uint256" }
          ]
        }
      ],
      outputs: [
        {
          name: "deployment",
          type: "tuple",
          internalType: "struct IControllerFactory.Deployment",
          components: [
            { name: "controller", type: "address", internalType: "address" },
            { name: "kernel", type: "address", internalType: "address" },
            { name: "vault", type: "address", internalType: "address" },
            { name: "token", type: "address", internalType: "address" },
            { name: "teamLocker", type: "address", internalType: "address" }
          ]
        }
      ]
    }
  ];

  var state = {
    account: "",
    chainId: "",
    provider: null,
    walletKind: "" // "moss" (default embedded wallet) | "injected" (browser extension)
  };

  var announcedProviders = [];
  var boundProvider = null;
  var lastProviderSource = "none";
  var walletModal = null;
  var networkModal = null;
  var swapUiState = {
    reversed: false,
    quoteId: "MEGA",
    slippageBps: 50,
    lastQuote: null
  };
  var swapQuoteTimer = null;
  var auctionUiState = {
    remainingLot: null,
    prices: [],
    mintDecimals: 18,
    chainId: ""
  };
  var presaleUiState = {
    remainingLot: null,
    presaleSize: null,
    sold: null,
    totalCommitted: null,
    minBid: null,
    price: null,
    minPrice: null,
    backingPerToken: null,
    assetAddress: "",
    assetUsdPrice: null,
    vaultAddress: "",
    isActive: false,
    mintDecimals: 18,
    quoteRequestId: 0,
    quoteTimer: null,
    chainId: "",
    inputMode: "enten",
    virtualReserve: null
  };
  var borrowUiState = {
    isActive: false,
    collateral: null,
    debt: null,
    available: null,
    entenBalance: null,
    backingPerToken: null,
    availableWithWallet: null,
    assetAddress: "",
    assetSymbol: "MEGA",
    assetDecimals: 18,
    collateralDecimals: 18,
    kernelAddress: "",
    vaultAddress: "",
    chainId: ""
  };
  var launchUiState = {
    adminAutofill: "",
    previewTimer: null,
    salt: ""
  };
  var auctionCountdownTimer = null;

  // Live data polling: refresh on-chain reads on a fixed cadence so price/lot figures stay current.
  var DATA_REFRESH_INTERVAL_MS = 3000;
  var presaleRefreshTimer = null;
  var presaleRefreshInFlight = false;
  var auctionRefreshTimer = null;
  var auctionRefreshInFlight = false;
  var borrowRefreshTimer = null;
  var borrowRefreshInFlight = false;

  // Runs loader() on an interval, skipping ticks while the tab is hidden or a prior load is still
  // in flight so slow RPC responses never stack up.
  function startDataPolling(getTimer, setTimer, getInFlight, setInFlight, loader) {
    if (getTimer()) return;

    function tick() {
      if (document.hidden || getInFlight()) return;
      setInFlight(true);
      Promise.resolve()
        .then(loader)
        .catch(function () {})
        .finally(function () {
          setInFlight(false);
        });
    }

    setTimer(window.setInterval(tick, DATA_REFRESH_INTERVAL_MS));
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tick();
    });
  }

  function startPresaleAutoRefresh() {
    startDataPolling(
      function () { return presaleRefreshTimer; },
      function (value) { presaleRefreshTimer = value; },
      function () { return presaleRefreshInFlight; },
      function (value) { presaleRefreshInFlight = value; },
      loadPresaleData
    );
  }

  function startAuctionAutoRefresh() {
    startDataPolling(
      function () { return auctionRefreshTimer; },
      function (value) { auctionRefreshTimer = value; },
      function () { return auctionRefreshInFlight; },
      function (value) { auctionRefreshInFlight = value; },
      loadAuctionData
    );
  }

  function startBorrowAutoRefresh() {
    startDataPolling(
      function () { return borrowRefreshTimer; },
      function (value) { borrowRefreshTimer = value; },
      function () { return borrowRefreshInFlight; },
      function (value) { borrowRefreshInFlight = value; },
      loadBorrowData
    );
  }

  window.addEventListener("eip6963:announceProvider", function (event) {
    var detail = event.detail;
    if (!detail || !detail.provider) return;

    if (
      !announcedProviders.some(function (entry) {
        return entry.provider === detail.provider;
      })
    ) {
      announcedProviders.push({
        info: detail.info || {},
        provider: detail.provider,
        source: "eip6963"
      });
      updateWalletUi();
    }
  });

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function getProviderEntries() {
    var entries = announcedProviders.slice();
    var ethereum = window.ethereum;

    function pushProvider(provider, info, source) {
      if (!provider) return;
      if (typeof provider.request !== "function") return;
      if (
        entries.some(function (entry) {
          return entry.provider === provider;
        })
      ) {
        return;
      }
      entries.push({ info: info || {}, provider: provider, source: source || "injected" });
    }

    function providerScore(entry) {
      var info = entry.info || {};
      var provider = entry.provider || {};
      var name = String(info.name || "").toLowerCase();
      var rdns = String(info.rdns || "").toLowerCase();

      if (provider.isRabby || name.indexOf("rabby") !== -1 || rdns.indexOf("rabby") !== -1) return 100;
      if (provider.isMetaMask || name.indexOf("metamask") !== -1 || rdns.indexOf("metamask") !== -1) return 80;
      if (provider.isPhantom || name.indexOf("phantom") !== -1 || rdns.indexOf("phantom") !== -1) return 75;
      if (provider.isCoinbaseWallet || name.indexOf("coinbase") !== -1 || rdns.indexOf("coinbase") !== -1) return 70;
      return 10;
    }

    if (ethereum) {
      if (Array.isArray(ethereum.providers) && ethereum.providers.length) {
        ethereum.providers.forEach(function (provider) {
          pushProvider(provider, {}, "window.ethereum.providers");
        });
      } else {
        pushProvider(ethereum, {}, "window.ethereum");
      }
    }

    [
      "rabby",
      "rabbyWallet",
      "rabbyProvider",
      "Rabby",
      "RabbyWallet",
      "RabbyWalletProvider"
    ].forEach(function (key) {
      try {
        pushProvider(window[key], { name: key, rdns: "io.rabby" }, "window." + key);
      } catch (error) {
        /* Some injected globals can throw when accessed. */
      }
    });

    try {
      Object.keys(window).forEach(function (key) {
        if (key.toLowerCase().indexOf("rabby") === -1) return;
        pushProvider(window[key], { name: key, rdns: "io.rabby" }, "window." + key);
      });
    } catch (error) {
      /* Window enumeration is blocked in a few hardened browser contexts. */
    }

    if (!entries.length) {
      lastProviderSource = "none";
      return [];
    }
    entries.sort(function (a, b) {
      return providerScore(b) - providerScore(a);
    });

    return entries;
  }

  function getProvider() {
    var entries = getProviderEntries();

    if (!entries.length) return null;
    lastProviderSource = entries[0].source || "injected";
    return entries[0].provider;
  }

  // ---- MOSS embedded wallet (default) ---------------------------------------
  // MegaETH MOSS is an iframe-based embedded wallet (no browser extension). We
  // expose it through a minimal EIP-1193 shim assigned to state.provider so it
  // slots into the existing provider plumbing (request(), switchNetwork, viem
  // custom() reads). Actual transaction sends bypass viem and go straight to the
  // native callContract API (Route 1) — that keeps gas sponsorship + silent
  // session grants available and avoids viem attaching MOSS-forbidden gas fields.
  var WALLET_KIND_KEY = "enten.walletKind";
  var MOSS_NETWORK_BY_CHAIN = { "0x10e6": "mainnet", "0x18c7": "testnet" };
  var mossSdkPromise = null;

  function loadMossSdk() {
    if (!mossSdkPromise) {
      mossSdkPromise = import("./moss-runtime.js")
        .then(function (module) {
          return module.mega;
        })
        .catch(function (error) {
          mossSdkPromise = null;
          throw error;
        });
    }
    return mossSdkPromise;
  }

  function withMossSdk(action) {
    return loadMossSdk().then(action);
  }

  // Session grants → prompt-free execution via a session key (silent: true).
  // OFF: the real issue was that MOSS fails on two SEQUENTIAL callContract calls
  // (a standalone buy works fine). We now batch approve+buy into one atomic call
  // (see mossSendCalls), which shows a single normal approval — no session grant
  // needed. Silent remains available for a fully prompt-free flow later; if
  // re-enabling, the grant must cover every call incl. approve and the spend cap
  // must exceed the payment (constants below are pre-sized for that).
  var MOSS_ENABLE_SILENT_SESSIONS = false;
  var MOSS_SESSION_EXPIRY_SECONDS = 24 * 60 * 60; // 24h active session
  var MOSS_SESSION_SPEND_LIMIT = 1000000000000000000000000n; // 1,000,000 (18-dec) cap

  var mossState = {
    initialisedNetwork: "",
    initPromise: null,
    subscribed: false,
    address: "",
    network: "",
    grantedNetworks: {}
  };

  var MOSS_INITIALISE_TIMEOUT_MS = 20000;

  function withTimeout(promise, timeoutMs, message) {
    var timeoutId;
    var timeout = new Promise(function (_resolve, reject) {
      timeoutId = window.setTimeout(function () {
        reject(new Error(message));
      }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(function () {
      window.clearTimeout(timeoutId);
    });
  }

  function mossRuntimeHint() {
    var host = window.location.hostname;
    var isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";

    if (!window.isSecureContext && !isLocalHost) {
      return " Open the Enten PWA over valid HTTPS because MOSS passkeys require a secure browser context.";
    }
    return " Check that account.megaeth.com is reachable and not blocked by content restrictions.";
  }

  function isMossWallet() {
    return state.walletKind === "moss";
  }

  function mossNetworkForChainId(chainId) {
    return MOSS_NETWORK_BY_CHAIN[String(chainId || "").toLowerCase()] || "mainnet";
  }

  function mossChainIdForNetwork(network) {
    return network === "testnet" ? "0x18c7" : "0x10e6";
  }

  function persistWalletKind(kind) {
    try {
      window.localStorage.setItem(WALLET_KIND_KEY, kind);
    } catch (error) {
      /* localStorage can be unavailable in some embedded contexts. */
    }
  }

  function storedWalletKind() {
    try {
      return window.localStorage.getItem(WALLET_KIND_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  // initialise() creates the wallet iframe + Penpal channel and is idempotent.
  // This wrapper also coalesces concurrent setup calls for the selected network.
  function ensureMossInitialised(network) {
    var target = network || mossState.network || mossNetworkForChainId(preferredChainId());

    if (mossState.initialisedNetwork === target && mossState.initPromise) {
      return mossState.initPromise;
    }

    mossState.network = target;
    mossState.initPromise = withTimeout(
      loadMossSdk()
      .then(function (mega) {
        // sponsorMode 'app-only' + sponsorToken 'native' are SDK defaults. No
        // sponsorUrl is passed (no backend), so gas is user-paid but abstracted
        // through the smart account. Add sponsorUrl here to sponsor gas later.
        return mega.initialise({ network: target, logging: "warn" }).then(function (status) {
          mossState.initialisedNetwork = target;
          subscribeMossStatus(mega);
          return status;
        });
      }),
      MOSS_INITIALISE_TIMEOUT_MS,
      "MOSS wallet did not become ready." + mossRuntimeHint()
    )
      .catch(function (error) {
        mossState.initPromise = null;
        throw error;
      });

    return mossState.initPromise;
  }

  function subscribeMossStatus(mega) {
    if (mossState.subscribed || !mega.events || typeof mega.events.onStatusChange !== "function") {
      return;
    }
    mossState.subscribed = true;
    mega.events.onStatusChange(function (status) {
      if (!isMossWallet()) return;
      if (status && status.status === "connected" && status.address) {
        mossState.address = status.address;
        state.account = status.address;
        state.chainId = mossChainIdForNetwork(mossState.network);
        updateWalletUi();
      } else if (status && status.status === "disconnected") {
        mossState.address = "";
        state.account = "";
        updateWalletUi();
        setStatus("[data-page-status]", "Wallet disconnected.", "warn");
      }
    });
  }

  async function connectMoss() {
    var network = mossState.network || mossNetworkForChainId(preferredChainId());
    await ensureMossInitialised(network);

    var mega = await loadMossSdk();
    var status = await mega.connect();
    if (!status || status.status !== "connected" || !status.address) {
      var error = new Error(
        status && status.status === "cancelled"
          ? "Wallet connection was cancelled."
          : "MOSS wallet did not connect."
      );
      if (status && status.status === "cancelled") error.code = 4001;
      throw error;
    }

    mossState.address = status.address;
    state.walletKind = "moss";
    state.account = status.address;
    state.chainId = mossChainIdForNetwork(network);
    persistWalletKind("moss");
    return status.address;
  }

  function mossExtractHash(result) {
    if (!result) return "";
    if (result.receipt && result.receipt.hash) return result.receipt.hash;
    return result.hash || result.transactionHash || "";
  }

  // Sends a raw {to, data, value} tx through MOSS's native callContract — the
  // MOSS callContract expects the contract in an `address` field (NOT `to`) plus
  // raw `data`/`value`. The wagmi connector maps to→address internally; we do the
  // same. Forbidden fields (gas/gasPrice/nonce/type/…) are intentionally omitted.
  function mossSendTransaction(tx) {
    return mossSendCalls([tx]);
  }

  // Sends one or more {to, data, value} calls through MOSS. An array is executed
  // ATOMICALLY in a single userOp — we use this to batch approve+buy, because MOSS
  // fails when two callContract calls are issued one after another (the second
  // call's approval never completes). Batching also means a single approval.
  async function mossSendCalls(txs) {
    var mega = await loadMossSdk();
    var silent = MOSS_ENABLE_SILENT_SESSIONS && !!mossState.grantedNetworks[mossState.network];
    var items = txs.map(function (tx) {
      var item = {
        address: tx.to,
        value: hexQuantityToBigInt(tx.value),
        silent: silent
      };
      if (tx.data && tx.data !== "0x") item.data = tx.data;
      return item;
    });
    var requestBody = items.length === 1 ? items[0] : items;

    console.log("[MOSS] callContract sending", {
      count: items.length,
      addresses: items.map(function (i) { return i.address; }),
      silent: silent
    });

    var result;
    try {
      result = await mega.callContract(requestBody);
    } catch (error) {
      console.error("[MOSS] callContract threw", {
        items: items.map(function (i) {
          return { address: i.address, hasData: !!i.data, value: String(i.value) };
        }),
        error: error
      });
      throw new Error("MOSS wallet error: " + (error && error.message ? error.message : String(error)));
    }

    console.log("[MOSS] callContract result", result);

    if (result && result.status === "cancelled") {
      console.warn("[MOSS] callContract cancelled", result);
      var cancelError = new Error("Transaction rejected in wallet.");
      cancelError.code = 4001;
      throw cancelError;
    }
    if (!result || result.status !== "approved") {
      console.error("[MOSS] callContract not approved", result);
      throw new Error((result && result.error) || "MOSS wallet transaction failed.");
    }

    var hash = mossExtractHash(result);
    if (!hash) throw new Error("MOSS wallet approved the transaction without a receipt hash.");
    return hash;
  }

  function makeMossProvider() {
    return {
      isMoss: true,
      request: function (args) {
        var method = args && args.method;
        var params = (args && args.params) || [];
        return mossRpc(method, params);
      },
      on: function () {},
      removeListener: function () {}
    };
  }

  async function mossRpc(method, params) {
    switch (method) {
      case "eth_requestAccounts":
        await connectMoss();
        return mossState.address ? [mossState.address] : [];
      case "eth_accounts":
        return mossState.address ? [mossState.address] : [];
      case "eth_chainId":
        return mossChainIdForNetwork(mossState.network || mossNetworkForChainId(preferredChainId()));
      case "net_version":
        return String(parseInt(mossChainIdForNetwork(mossState.network), 16));
      case "wallet_switchEthereumChain": {
        var target = params && params[0] && params[0].chainId;
        var nextNetwork = mossNetworkForChainId(target);
        if (nextNetwork !== mossState.network) {
          mossState.initPromise = null; // force re-init on the new network
          mossState.initialisedNetwork = "";
          await ensureMossInitialised(nextNetwork);
          if (mossState.address) {
            await connectMoss();
            grantMossPagePermissions().catch(function () {});
          }
        }
        return null;
      }
      case "wallet_addEthereumChain":
        return null;
      case "personal_sign":
        return withMossSdk(function (mega) {
          return mega.signMessage(typeof params[0] === "string" ? params[0] : params[1]);
        });
      case "eth_sign":
        return withMossSdk(function (mega) {
          return mega.signMessage(params[1]);
        });
      case "eth_sendTransaction":
        return mossSendTransaction(params[0] || {});
      default:
        // Read-only JSON-RPC: forward to the network's public HTTP endpoint.
        return mossHttpRpc(method, params);
    }
  }

  async function mossHttpRpc(method, params) {
    var chain = supportedChain(mossChainIdForNetwork(mossState.network)) || currentChainConfig();
    var url = chain && chain.rpcUrls && chain.rpcUrls[0];
    if (!url) throw new Error("No RPC endpoint configured for MOSS read.");

    var response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: method, params: params || [] })
    });
    var payload = await response.json();
    if (payload && payload.error) {
      var rpcError = new Error(payload.error.message || "RPC error");
      rpcError.code = payload.error.code;
      throw rpcError;
    }
    return payload ? payload.result : null;
  }

  // Write functions each page calls. Scoping a session grant to exactly these
  // lets repeat actions run silently (no approval popup) for the grant window.
  function mossPermissionCalls(chain) {
    var calls = [];
    if (!chain) return calls;

    function add(address, signature) {
      if (isAddress(address)) calls.push({ to: address, signature: signature });
    }

    // ERC20 approve must be covered too, or the approve step still pops the
    // (broken) UI. Scope it to every payment token configured on this chain.
    function addApprove(address) {
      add(address, "approve(address,uint256)");
    }
    if (chain.tokens) {
      if (chain.tokens.enten) addApprove(chain.tokens.enten.address);
      (chain.tokens.quotes || []).forEach(function (token) {
        if (token && token.address && token.address !== "native") addApprove(token.address);
      });
    }
    if (presaleUiState.assetAddress) addApprove(presaleUiState.assetAddress);

    if (chain.auction) {
      add(chain.auction.address, "buy(uint256,uint256,uint256,(address,uint256)[])");
      add(chain.auction.address, "startNextAuction()");
    }
    var presale = presaleAddress(chain);
    add(presale, "buy(uint256,uint256,uint256)");
    add(presale, "buyMax(uint256,uint256)");
    var borrow = borrowAddress(chain);
    add(borrow, "deposit(uint256)");
    add(borrow, "withdraw(uint256)");
    add(borrow, "borrow((address,uint256)[])");
    add(borrow, "borrowMax()");
    add(borrow, "depositAndBorrow(uint256,(address,uint256)[])");
    add(borrow, "repay((address,uint256)[])");
    add(borrow, "repayAll()");
    add(borrow, "repayAndWithdraw((address,uint256)[],uint256)");
    if (chain.uniswap) {
      add(chain.uniswap.universalRouter, "execute(bytes,bytes[],uint256)");
    }
    return calls;
  }

  async function grantMossPagePermissions() {
    if (!MOSS_ENABLE_SILENT_SESSIONS || !isMossWallet()) return;

    var mega = await loadMossSdk();
    var network = mossState.network;
    var chain = supportedChain(mossChainIdForNetwork(network));
    var calls = mossPermissionCalls(chain);
    if (!calls.length) return;

    try {
      var existing = await mega.getPermissions();
      if (existing && existing.permissions) {
        mossState.grantedNetworks[network] = true;
        return;
      }
      await mega.grantPermissions({
        permissions: {
          expiry: Math.floor(Date.now() / 1000) + MOSS_SESSION_EXPIRY_SECONDS,
          permissions: {
            calls: calls,
            spend: [{ limit: MOSS_SESSION_SPEND_LIMIT, period: "day" }]
          }
        }
      });
      mossState.grantedNetworks[network] = true;
      setStatus(
        "[data-page-status]",
        "Session approved — actions on " + (chain ? chain.shortName : "this network") + " won't need repeat confirmations.",
        "ok"
      );
    } catch (error) {
      // Declined or unsupported: transactions simply use the normal approval UI.
      mossState.grantedNetworks[network] = false;
    }
  }

  function providerName(provider) {
    var announced;
    if (!provider) return "none";

    announced = announcedProviders.find(function (entry) {
      return entry.provider === provider;
    });

    if (announced && announced.info && announced.info.name) return announced.info.name;
    if (provider.isRabby) return "Rabby";
    if (provider.isMetaMask) return "MetaMask";
    if (provider.isPhantom) return "Phantom";
    if (provider.isCoinbaseWallet) return "Coinbase Wallet";
    return "Injected wallet";
  }

  function providerEntryName(entry) {
    var info = entry.info || {};
    var provider = entry.provider || {};

    if (info.name) return info.name;
    if (provider.isRabby) return "Rabby";
    if (provider.isMetaMask) return "MetaMask";
    if (provider.isPhantom) return "Phantom";
    if (provider.isCoinbaseWallet) return "Coinbase Wallet";
    return "Injected wallet";
  }

  function discoverProvider(timeoutMs) {
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }

    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve(getProvider());
      }, timeoutMs);
    });
  }

  function discoverProviderEntries(timeoutMs) {
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }

    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve(getProviderEntries());
      }, timeoutMs);
    });
  }

  function ensureWalletModal() {
    var style;
    var overlay;

    if (walletModal) return walletModal;

    style = document.createElement("style");
    style.textContent =
      ".enten-wallet-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;overflow-y:auto;background:rgba(12,13,18,.72);backdrop-filter:blur(18px);color:#f4f4f2;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:0}" +
      ".enten-wallet-modal[data-open='true']{display:flex}" +
      ".enten-wallet-dialog{position:relative;display:flex;flex-direction:column;width:min(100%,460px);max-height:calc(100dvh - 48px);border:1px solid rgba(244,244,242,.14);border-radius:0;background:rgba(12,13,18,.94);box-shadow:0 28px 90px rgba(0,0,0,.5);overflow:hidden}" +
      ".enten-wallet-dialog:before{position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(239,161,67,.5),transparent);content:'';opacity:.8}" +
      ".enten-wallet-dialog:after{position:absolute;right:-120px;bottom:-120px;width:260px;height:260px;border-radius:999px;background:rgba(76,178,168,.07);filter:blur(70px);content:'';pointer-events:none}" +
      ".enten-wallet-head{position:relative;z-index:1;flex:0 0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:22px;padding:28px 28px 20px;border-bottom:1px solid rgba(244,244,242,.08);background-image:linear-gradient(rgba(244,244,242,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(244,244,242,.022) 1px,transparent 1px);background-size:24px 24px}" +
      ".enten-wallet-kicker{display:flex;align-items:center;gap:12px;margin-bottom:12px;color:rgba(244,244,242,.58);font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase}" +
      ".enten-wallet-kicker:before{display:block;width:12px;height:1px;background:#efa143;content:''}" +
      ".enten-wallet-title{margin:0 0 8px;color:#f4f4f2;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;letter-spacing:0;line-height:1.02}" +
      ".enten-wallet-sub{max-width:310px;margin:0;color:rgba(244,244,242,.6);font-size:13px;font-weight:300;line-height:1.55}" +
      ".enten-wallet-close{border:0;background:transparent;color:rgba(244,244,242,.56);font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;transition:color .25s ease}" +
      ".enten-wallet-close:hover{color:#efa143}" +
      ".enten-wallet-list{position:relative;z-index:1;display:grid;gap:10px;padding:18px;min-height:0;overflow-y:auto}" +
      ".enten-wallet-option{display:grid;grid-template-columns:44px minmax(0,1fr);gap:14px;align-items:center;width:100%;min-height:72px;padding:14px;border:1px solid rgba(244,244,242,.1);border-radius:0;background:rgba(244,244,242,.025);color:#f4f4f2;text-align:left;cursor:pointer;transition:border-color .25s ease,background-color .25s ease,transform .25s ease}" +
      ".enten-wallet-option:hover{border-color:rgba(239,161,67,.55);background:rgba(239,161,67,.07);transform:translateY(-1px)}" +
      ".enten-wallet-badge{display:grid;width:44px;height:44px;place-items:center;border:1px solid rgba(76,178,168,.32);border-radius:0;background:rgba(76,178,168,.08);color:#4cb2a8;font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase}" +
      ".enten-wallet-name{display:block;margin-bottom:6px;color:#f4f4f2;font-size:15px;font-weight:500;line-height:1.15}" +
      ".enten-wallet-meta{display:block;color:rgba(244,244,242,.46);font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:10px;letter-spacing:.08em;line-height:1.35;text-transform:uppercase;overflow-wrap:anywhere}" +
      ".enten-wallet-empty{position:relative;z-index:1;padding:20px 28px 28px;color:rgba(244,244,242,.62);font-size:13px;font-weight:300;line-height:1.55}" +
      "@media(max-width:560px){.enten-wallet-modal{padding:16px}.enten-wallet-dialog{max-height:calc(100dvh - 32px)}.enten-wallet-title{font-size:30px}.enten-wallet-head{padding:24px 22px 18px}.enten-wallet-list{padding:14px}.enten-wallet-option{min-height:68px}}";
    document.head.appendChild(style);

    overlay = document.createElement("div");
    overlay.className = "enten-wallet-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "enten-wallet-title");
    overlay.innerHTML =
      '<div class="enten-wallet-dialog">' +
      '<div class="enten-wallet-head">' +
      '<div><div class="enten-wallet-kicker">Wallet Route</div><h2 class="enten-wallet-title" id="enten-wallet-title">Connect Protocol Access</h2>' +
      '<p class="enten-wallet-sub">Connect with the MOSS embedded wallet (recommended) or a browser extension to route auction, portal, and network actions through this session.</p></div>' +
      '<button class="enten-wallet-close" type="button" data-wallet-modal-close>Close</button>' +
      "</div>" +
      '<div class="enten-wallet-list" data-wallet-modal-list></div>' +
      '<div class="enten-wallet-empty" data-wallet-modal-empty hidden>No injected wallet providers were detected. Unlock your wallet extension and allow it on this local Enten interface.</div>' +
      "</div>";
    document.body.appendChild(overlay);

    walletModal = {
      overlay: overlay,
      list: $("[data-wallet-modal-list]", overlay),
      empty: $("[data-wallet-modal-empty]", overlay),
      close: $("[data-wallet-modal-close]", overlay)
    };

    return walletModal;
  }

  function walletInitials(name) {
    return String(name || "Wallet")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0);
      })
      .join("") || "W";
  }

  // Reuses the wallet-modal stylesheet (injected by ensureWalletModal) for a
  // parallel network-picker dialog. Calling ensureWalletModal here guarantees
  // the .enten-wallet-* styles exist; the hidden wallet modal it creates is inert.
  function ensureNetworkModal() {
    if (networkModal) return networkModal;
    ensureWalletModal();

    var overlay = document.createElement("div");
    overlay.className = "enten-wallet-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="enten-wallet-dialog">' +
      '<div class="enten-wallet-head">' +
      '<div><div class="enten-wallet-kicker">Network</div><h2 class="enten-wallet-title">Switch Network</h2>' +
      '<p class="enten-wallet-sub">Choose the MegaETH network to route reads, balances, and transactions through.</p></div>' +
      '<button class="enten-wallet-close" type="button" data-network-modal-close>Close</button>' +
      "</div>" +
      '<div class="enten-wallet-list" data-network-modal-list></div>' +
      "</div>";
    document.body.appendChild(overlay);

    networkModal = {
      overlay: overlay,
      list: $("[data-network-modal-list]", overlay),
      close: $("[data-network-modal-close]", overlay)
    };

    return networkModal;
  }

  function openNetworkSelector() {
    var modal = ensureNetworkModal();
    var current = (state.chainId || preferredChainId() || "").toLowerCase();

    modal.list.innerHTML = "";

    function close() {
      modal.overlay.removeAttribute("data-open");
    }

    Object.keys(SUPPORTED_CHAINS).forEach(function (chainId) {
      var chain = SUPPORTED_CHAINS[chainId];
      var isCurrent = chainId.toLowerCase() === current;
      var button = document.createElement("button");

      button.className = "enten-wallet-option";
      button.type = "button";
      button.innerHTML =
        '<span class="enten-wallet-badge"></span>' +
        '<span><span class="enten-wallet-name"></span><span class="enten-wallet-meta"></span></span>';
      $(".enten-wallet-badge", button).textContent = walletInitials(chain.shortName);
      $(".enten-wallet-name", button).textContent = chain.chainName + (isCurrent ? " · current" : "");
      $(".enten-wallet-meta", button).textContent = "Chain " + chain.chainIdDecimal;

      button.addEventListener("click", async function () {
        close();
        if (isCurrent) return;
        setStatus("[data-page-status]", "Switching to " + chain.shortName + "...", "warn");
        try {
          var ok = await switchNetwork(chainId);
          setStatus(
            "[data-page-status]",
            ok ? "Network switched to " + chain.shortName + "." : "Could not switch to " + chain.shortName + ".",
            ok ? "ok" : "warn"
          );
        } catch (error) {
          setStatus("[data-page-status]", "Could not switch to " + chain.shortName + ".", "warn");
        }
      });

      modal.list.appendChild(button);
    });

    modal.close.onclick = close;
    modal.overlay.onclick = function (event) {
      if (event.target === modal.overlay) close();
    };
    modal.overlay.dataset.open = "true";
  }

  // Makes the network status label (the "MegaETH Testnet" pill) a clickable
  // switcher on every page that shows it.
  function bindNetworkSwitcher() {
    $all("[data-network-status]").forEach(function (statusEl) {
      var label = statusEl.closest(".network-label, .live-status") || statusEl.parentElement;
      if (!label || label.dataset.networkSwitchBound) return;
      label.dataset.networkSwitchBound = "true";
      label.style.cursor = "pointer";
      label.setAttribute("role", "button");
      label.setAttribute("tabindex", "0");
      label.setAttribute("title", "Switch network");
      label.addEventListener("click", openNetworkSelector);
      label.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openNetworkSelector();
        }
      });
    });
  }

  function openWalletSelector(entries) {
    var modal = ensureWalletModal();

    modal.list.innerHTML = "";
    modal.empty.hidden = entries.length > 0;

    return new Promise(function (resolve) {
      function finish(entry) {
        modal.overlay.removeAttribute("data-open");
        document.removeEventListener("keydown", onKeydown);
        resolve(entry || null);
      }

      function onKeydown(event) {
        if (event.key === "Escape") finish(null);
      }

      entries.forEach(function (entry) {
        var button = document.createElement("button");
        var name;
        var meta;

        if (entry.kind === "moss") {
          name = entry.name || "MOSS Embedded Wallet";
          meta = entry.meta || "MegaETH · embedded · no extension";
        } else {
          name = providerEntryName(entry.entry);
          meta =
            entry.entry.info && entry.entry.info.rdns
              ? entry.entry.info.rdns
              : entry.entry.source || "injected";
        }

        button.className = "enten-wallet-option";
        button.type = "button";
        button.innerHTML =
          '<span class="enten-wallet-badge"></span>' +
          '<span><span class="enten-wallet-name"></span><span class="enten-wallet-meta"></span></span>';
        $(".enten-wallet-badge", button).textContent = entry.kind === "moss" ? "MO" : walletInitials(name);
        $(".enten-wallet-name", button).textContent = name;
        $(".enten-wallet-meta", button).textContent = meta;
        button.addEventListener("click", function () {
          if (entry.kind !== "moss") lastProviderSource = entry.entry.source || "injected";
          finish(entry);
        });

        modal.list.appendChild(button);
      });

      modal.close.onclick = function () {
        finish(null);
      };
      modal.overlay.onclick = function (event) {
        if (event.target === modal.overlay) finish(null);
      };
      document.addEventListener("keydown", onKeydown);
      modal.overlay.dataset.open = "true";
    });
  }

  function request(method, params) {
    if (!state.provider) return Promise.reject(new Error("No wallet provider"));
    return state.provider.request({ method: method, params: params });
  }

  function shortenAddress(address) {
    if (!address) return "Not connected";
    return address.slice(0, 6) + "..." + address.slice(-4);
  }

  function supportedChain(chainId) {
    return chainId ? SUPPORTED_CHAINS[chainId.toLowerCase()] : null;
  }

  function currentChainConfig() {
    return supportedChain(state.chainId);
  }

  function chainWithConfiguredAuction() {
    var preferred = supportedChain(preferredChainId());

    if (preferred && preferred.auction && isAddress(preferred.auction.address)) {
      return preferred;
    }

    return (
      Object.keys(SUPPORTED_CHAINS)
        .map(function (chainId) {
          return SUPPORTED_CHAINS[chainId];
        })
        .find(function (chain) {
          return chain && chain.auction && isAddress(chain.auction.address);
        }) || null
    );
  }

  function activeAuctionChainConfig() {
    var connected = currentChainConfig();
    if (connected && connected.auction && isAddress(connected.auction.address)) return connected;
    return chainWithConfiguredAuction();
  }

  function presaleAddress(chain) {
    var configured = chain && chain.presale ? chain.presale.address : "";
    var override = "";
    var overrides;

    try {
      overrides = window.ENTEN_PRESALE_ADDRESSES || null;
      if (overrides && chain) {
        override =
          overrides[chain.chainId] ||
          overrides[chain.chainId.toLowerCase()] ||
          overrides[String(chain.chainIdDecimal)] ||
          "";
      }
      if (!override) {
        override = window.ENTEN_PRESALE_ADDRESS || "";
      }
    } catch (error) {
      override = "";
    }

    if (isAddress(override)) return override;
    return isAddress(configured) ? configured : "";
  }

  function presaleKernelAddress(chain) {
    return chain && chain.presale && isAddress(chain.presale.kernelAddress) ? chain.presale.kernelAddress : "";
  }

  function presaleBackingAssetConfig(chain) {
    var wantedId = chain && chain.presale && chain.presale.assetId ? chain.presale.assetId : "MEGA";
    var quotes = chain && chain.tokens && Array.isArray(chain.tokens.quotes) ? chain.tokens.quotes : [];
    return (
      quotes.find(function (token) {
        return token && (token.id === wantedId || token.symbol === wantedId);
      }) || null
    );
  }

  function chainWithConfiguredPresale() {
    var preferred = supportedChain(preferredChainId());

    if (presaleAddress(preferred)) {
      return preferred;
    }

    return (
      Object.keys(SUPPORTED_CHAINS)
        .map(function (chainId) {
          return SUPPORTED_CHAINS[chainId];
        })
        .find(function (chain) {
          return presaleAddress(chain);
        }) || null
    );
  }

  function activePresaleChainConfig() {
    var connected = currentChainConfig();
    if (presaleAddress(connected)) return connected;
    return chainWithConfiguredPresale();
  }

  function controllerFactoryAddress(chain) {
    return chain && chain.controllerFactory && isAddress(chain.controllerFactory.address) ? chain.controllerFactory.address : "";
  }

  function chainWithConfiguredFactory() {
    var preferred = supportedChain(preferredChainId());

    if (controllerFactoryAddress(preferred)) {
      return preferred;
    }

    return (
      Object.keys(SUPPORTED_CHAINS)
        .map(function (chainId) {
          return SUPPORTED_CHAINS[chainId];
        })
        .find(function (chain) {
          return controllerFactoryAddress(chain);
        }) || null
    );
  }

  function activeFactoryChainConfig() {
    var connected = currentChainConfig();
    if (controllerFactoryAddress(connected)) return connected;
    return chainWithConfiguredFactory();
  }

  function borrowAddress(chain) {
    return chain && chain.borrow && isAddress(chain.borrow.address) ? chain.borrow.address : "";
  }

  function borrowControllerAddress(chain) {
    return chain && chain.borrow && isAddress(chain.borrow.controllerAddress) ? chain.borrow.controllerAddress : "";
  }

  function borrowKernelAddress(chain) {
    return chain && chain.borrow && isAddress(chain.borrow.kernelAddress) ? chain.borrow.kernelAddress : "";
  }

  // The borrowable asset surfaced by the page (MEGA). Resolved from the chain's quote
  // tokens so symbol/decimals stay correct per network.
  function borrowAssetConfig(chain) {
    var wantedId = chain && chain.borrow && chain.borrow.assetId ? chain.borrow.assetId : "MEGA";
    var quotes = chain && chain.tokens && Array.isArray(chain.tokens.quotes) ? chain.tokens.quotes : [];
    return (
      quotes.find(function (token) {
        return token && (token.id === wantedId || token.symbol === wantedId);
      }) || null
    );
  }

  function chainWithConfiguredBorrow() {
    var preferred = supportedChain(preferredChainId());

    if (borrowAddress(preferred)) {
      return preferred;
    }

    return (
      Object.keys(SUPPORTED_CHAINS)
        .map(function (chainId) {
          return SUPPORTED_CHAINS[chainId];
        })
        .find(function (chain) {
          return borrowAddress(chain);
        }) || null
    );
  }

  function activeBorrowChainConfig() {
    var connected = currentChainConfig();
    if (borrowAddress(connected)) return connected;
    return chainWithConfiguredBorrow() || connected || supportedChain(preferredChainId());
  }

  function currentChainName() {
    var chain = supportedChain(state.chainId);
    if (chain) return chain.shortName;
    if (state.chainId) return "Unsupported";
    return "Network";
  }

  function preferredChainId() {
    var stored = "";

    try {
      stored = window.localStorage.getItem(PREFERRED_CHAIN_KEY) || "";
    } catch (error) {
      stored = "";
    }

    return supportedChain(stored) ? stored.toLowerCase() : DEFAULT_CHAIN_ID;
  }

  function supportedChainNames() {
    return Object.keys(SUPPORTED_CHAINS)
      .map(function (chainId) {
        return SUPPORTED_CHAINS[chainId].shortName;
      })
      .join(" or ");
  }

  function strip0x(value) {
    return String(value || "").replace(/^0x/i, "");
  }

  function isAddress(value) {
    return /^0x[0-9a-fA-F]{40}$/.test(String(value || ""));
  }

  function parseUnits(value, decimals) {
    var input = String(value || "").trim();
    var parts;
    var whole;
    var fraction;

    if (!input || !/^\d*(\.\d*)?$/.test(input)) return 0n;
    if (input === ".") return 0n;

    parts = input.split(".");
    whole = parts[0] || "0";
    fraction = parts[1] === undefined ? "" : parts[1].slice(0, decimals);

    return viemParseUnits(fraction ? whole + "." + fraction : whole, decimals);
  }

  function parseTokenAmountInput(value) {
    return parseUnits(String(value || "").replace(/[,_\s]/g, ""), 18);
  }

  function formatUnits(value, decimals, maxFractionDigits) {
    var formatted = viemFormatUnits(BigInt(value || 0), decimals);
    var parts = formatted.split(".");
    var whole = parts[0];
    var fraction = parts[1] || "";
    var trimmed = fraction.slice(0, maxFractionDigits || 4).replace(/0+$/, "");

    return trimmed ? whole.toString() + "." + trimmed : whole.toString();
  }

  function groupedNumber(value) {
    var parts = String(value || "0").split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts[1] ? parts[0] + "." + parts[1] : parts[0];
  }

  function formatTokenInputAmount(amount) {
    return groupedNumber(formatUnits(amount, 18, 6));
  }

  function formatPercent(numerator, denominator) {
    var scaled;
    var whole;
    var fraction;

    if (!denominator || denominator <= 0n) return "--";

    scaled = (BigInt(numerator || 0) * 10000n) / BigInt(denominator);
    whole = scaled / 100n;
    fraction = (scaled % 100n).toString().padStart(2, "0").replace(/0+$/, "");
    return fraction ? whole.toString() + "." + fraction + "%" : whole.toString() + "%";
  }

  function randomBytes32() {
    var bytes = new Uint8Array(32);
    var cryptoSource = window.crypto || window.msCrypto;

    if (cryptoSource && typeof cryptoSource.getRandomValues === "function") {
      cryptoSource.getRandomValues(bytes);
    } else {
      for (var index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }

    return (
      "0x" +
      Array.prototype.map
        .call(bytes, function (byte) {
          return byte.toString(16).padStart(2, "0");
        })
        .join("")
    );
  }

  function formatUnitsForInput(value, decimals) {
    var formatted = viemFormatUnits(BigInt(value || 0), decimals);
    return formatted.indexOf(".") === -1 ? formatted : formatted.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatUnitsCompact(value, decimals) {
    var bigint = BigInt(value || 0);
    var base = 10n ** BigInt(decimals);
    var compactTiers = [
      { threshold: 1000000000n, divisor: 1000000000n, suffix: "B", fractionDigits: 1 },
      { threshold: 1000000n, divisor: 1000000n, suffix: "M", fractionDigits: 1 },
      { threshold: 1000n, divisor: 1000n, suffix: "K", fractionDigits: 1 },
      { threshold: 100n, divisor: 1000n, suffix: "K", fractionDigits: 3 }
    ];
    var whole;
    var fraction;
    var significantIndex;
    var end;
    var trimmed;
    var tier;
    var index;

    if (bigint === 0n) return "0";

    function formatRatio(numerator, denominator, fractionDigits) {
      var scale = 10n ** BigInt(fractionDigits);
      var scaled = (numerator * scale) / denominator;
      var remainder = (numerator * scale) % denominator;
      var whole;
      var fraction;

      if (remainder * 2n >= denominator) {
        scaled += 1n;
      }

      whole = scaled / scale;
      fraction = (scaled % scale).toString().padStart(fractionDigits, "0").replace(/0+$/, "");
      return fraction ? whole.toString() + "." + fraction : whole.toString();
    }

    for (index = 0; index < compactTiers.length; index += 1) {
      tier = compactTiers[index];
      if (bigint >= tier.threshold * base) {
        return formatRatio(bigint, base * tier.divisor, tier.fractionDigits) + tier.suffix;
      }
    }

    whole = bigint / base;
    if (whole > 0n) return formatUnits(bigint, decimals, 3);

    fraction = (bigint % base).toString().padStart(decimals, "0");
    significantIndex = fraction.search(/[1-9]/);
    if (significantIndex === -1) return "0";

    end = Math.min(decimals, significantIndex + 4);
    trimmed = fraction.slice(0, end).replace(/0+$/, "");
    return "0." + trimmed;
  }

  function shouldUseWalletForRead(chain) {
    // MOSS reads always go over HTTP RPC (the shim forwards them anyway).
    return (
      state.provider &&
      !isMossWallet() &&
      chain &&
      state.chainId &&
      state.chainId.toLowerCase() === chain.chainId.toLowerCase()
    );
  }

  function viemChain(chain) {
    var blockExplorer = chain && chain.blockExplorerUrls && chain.blockExplorerUrls[0];
    var rpcUrls = chain && chain.rpcUrls && chain.rpcUrls.length ? chain.rpcUrls : [];

    if (!chain) throw new Error("No chain configured");

    return {
      id: chain.chainIdDecimal,
      name: chain.chainName,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: {
        default: { http: rpcUrls },
        public: { http: rpcUrls }
      },
      contracts: isAddress(chain.multicall3)
        ? {
            multicall3: {
              address: chain.multicall3,
              blockCreated: 0
            }
          }
        : undefined,
      blockExplorers: blockExplorer
        ? {
            default: {
              name: chain.shortName + " Explorer",
              url: blockExplorer
            }
          }
        : undefined
    };
  }

  function publicClientForChain(chain) {
    var targetChain = chain || currentChainConfig();
    var transport;

    if (!targetChain) throw new Error("No chain configured for read");
    if (shouldUseWalletForRead(targetChain)) {
      transport = custom(state.provider);
    } else {
      transport = http(targetChain.rpcUrls && targetChain.rpcUrls[0]);
    }

    return createPublicClient({
      chain: viemChain(targetChain),
      transport: transport
    });
  }

  function walletClientForChain(chain) {
    var targetChain = chain || currentChainConfig();

    if (!targetChain) throw new Error("No chain configured for wallet action");
    if (!state.provider) throw new Error("No wallet provider");

    return createWalletClient({
      account: state.account,
      chain: viemChain(targetChain),
      transport: custom(state.provider)
    });
  }

  function hexQuantityToBigInt(value) {
    if (value === undefined || value === null || value === "") return 0n;
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(value);
    if (/^0x[0-9a-fA-F]+$/.test(String(value))) return BigInt(value);
    if (/^\d+$/.test(String(value))) return BigInt(value);
    return 0n;
  }

  function normalizeAssetItems(items) {
    return (items || [])
      .map(function (item) {
        var address = item && (item.address || item.token || item[0]);
        var amount = item && (item.amount !== undefined ? item.amount : item[1]);

        if (!isAddress(address)) return null;
        return {
          address: address,
          amount: BigInt(amount || 0)
        };
      })
      .filter(Boolean);
  }

  function hexToUtf8(hex) {
    var clean = strip0x(hex);
    var output = "";

    for (var index = 0; index < clean.length; index += 2) {
      var code = parseInt(clean.slice(index, index + 2), 16);
      if (!code) continue;
      output += String.fromCharCode(code);
    }

    return output;
  }

  function errorDataFromValue(value) {
    if (!value) return "";
    if (typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value)) return value;
    if (typeof value !== "object") return "";

    return (
      errorDataFromValue(value.data) ||
      errorDataFromValue(value.error) ||
      errorDataFromValue(value.result) ||
      errorDataFromValue(value.originalError)
    );
  }

  function decodeRevertReason(data) {
    var clean = strip0x(data);
    var selector = clean.slice(0, 8).toLowerCase();
    var length;
    var stringStart;

    if (!clean) return "";

    if (selector === "08c379a0" && clean.length >= 136) {
      length = Number(BigInt("0x" + clean.slice(72, 136)));
      stringStart = 136;
      return hexToUtf8(clean.slice(stringStart, stringStart + length * 2));
    }

    if (selector === "4e487b71" && clean.length >= 72) {
      return "Panic 0x" + BigInt("0x" + clean.slice(8, 72)).toString(16);
    }

    return "Custom error 0x" + selector;
  }

  function simulationFailureMessage(error) {
    var data = errorDataFromValue(error);
    var decoded = decodeRevertReason(data);
    var message = error && error.message ? String(error.message) : "";

    if (decoded) return decoded;
    if (message) return message.replace(/^execution reverted:?\s*/i, "");
    return "Transaction simulation failed.";
  }

  async function simulateTransaction(tx, chain) {
    var client = publicClientForChain(chain || currentChainConfig());

    await client.call({
      account: tx.from,
      to: tx.to,
      data: tx.data || "0x",
      value: hexQuantityToBigInt(tx.value)
    });
  }

  function sendTransaction(tx, chain) {
    if (isMossWallet()) {
      // Native Route 1: callContract handles signing, gas, and (when granted)
      // silent execution. viem is bypassed so no forbidden gas fields are added.
      return mossSendTransaction(tx);
    }
    return walletClientForChain(chain || currentChainConfig()).sendTransaction({
      account: tx.from || state.account,
      to: tx.to,
      data: tx.data || "0x",
      value: hexQuantityToBigInt(tx.value)
    });
  }

  async function waitForTransaction(txHash, chain) {
    try {
      var receipt = await publicClientForChain(chain || currentChainConfig()).waitForTransactionReceipt({
        hash: txHash,
        pollingInterval: 2000,
        timeout: 120000
      });
      return Object.assign({}, receipt, {
        status: receipt.status === "reverted" ? "0x0" : "0x1"
      });
    } catch (error) {
      return null;
    }
  }

  function refreshAuctionDataSoon(delayMs) {
    window.setTimeout(loadAuctionData, delayMs || 1500);
  }

  function refreshPresaleDataSoon(delayMs) {
    window.setTimeout(loadPresaleData, delayMs || 1500);
  }

  function refreshSwapBalancesSoon(delayMs) {
    window.setTimeout(loadSwapBalances, delayMs || 1500);
  }

  function refreshBorrowDataSoon(delayMs) {
    window.setTimeout(loadBorrowData, delayMs || 1500);
  }

  function setText(selector, value) {
    $all(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function setStatus(selector, text, tone) {
    $all(selector).forEach(function (node) {
      node.textContent = text;
      if (tone) {
        node.dataset.tone = tone;
      } else {
        delete node.dataset.tone;
      }
    });
  }

  function shouldSetPassivePageStatus() {
    var node = $("[data-page-status]");
    var text = node ? node.textContent || "" : "";
    return !/(submitted|submitting|simulating|approving|waiting for|reading presale quote|preflight|failed|reverted|confirmed)/i.test(text);
  }

  function setPill(selector, text, stateValue) {
    $all(selector).forEach(function (node) {
      node.textContent = text;
      if (stateValue) {
        node.dataset.state = stateValue;
      } else {
        delete node.dataset.state;
      }
    });
  }

  function setDot(selector, stateValue) {
    $all(selector).forEach(function (node) {
      if (stateValue) {
        node.dataset.state = stateValue;
      } else {
        delete node.dataset.state;
      }
    });
  }

  function updateWalletDebug() {
    var provider = state.provider;
    var protocol = window.location.protocol || "unknown:";
    var host = window.location.host || "local file";
    var urlLabel = protocol === "file:" ? "file://" : protocol + "//" + host;
    var names = announcedProviders
      .map(function (entry) {
        return entry.info && entry.info.name ? entry.info.name : "unknown";
      })
      .join(", ");

    if (provider) {
      setText("[data-wallet-debug]", "Provider: " + providerName(provider) + " via " + lastProviderSource + " on " + urlLabel + ".");
      return;
    }

    if (protocol === "file:") {
      setText("[data-wallet-debug]", "Provider: none. Rabby usually does not inject on file:// pages; use http://localhost or http://127.0.0.1.");
      return;
    }

    setText(
      "[data-wallet-debug]",
      "Provider: none on " + urlLabel + ". EIP-6963 announcements: " + (names || "none") + ". Check Rabby site access for this URL."
    );
  }

  function contractAddress(kind) {
    var chain =
      kind === "swap"
        ? currentChainConfig() || activeSwapChainConfig()
        : kind === "auction"
          ? currentChainConfig() || activeAuctionChainConfig()
          : kind === "presale"
            ? currentChainConfig() || activePresaleChainConfig()
            : kind === "factory"
              ? currentChainConfig() || activeFactoryChainConfig()
              : currentChainConfig();
    if (!chain) return "";

    if (kind === "auction") {
      return chain.auction && chain.auction.address ? chain.auction.address : "";
    }

    if (kind === "presale") {
      return presaleAddress(chain);
    }

    if (kind === "factory") {
      return controllerFactoryAddress(chain);
    }

    if (kind === "swap") {
      if (chain.kumbaya && isAddress(chain.kumbaya.swapRouter)) return chain.kumbaya.swapRouter;
      return chain.uniswap && chain.uniswap.universalRouter ? chain.uniswap.universalRouter : "";
    }

    return "";
  }

  function updateContractLabels() {
    setText("[data-auction-address]", contractAddress(IS_PRESALE_PAGE ? "presale" : "auction") || "Not configured");
    setText("[data-swap-address]", contractAddress("swap") || "Not configured");
    setText("[data-launch-factory-address]", contractAddress("factory") || "Not configured");
  }

  function activeSwapChainConfig() {
    var connectedChain = currentChainConfig();
    if (state.account && connectedChain) return connectedChain;
    return SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
  }

  function outputTokenConfig(chain) {
    var config = chain || activeSwapChainConfig();
    return config && config.tokens ? config.tokens.enten : null;
  }

  function quoteTokenConfigs(chain) {
    var config = chain || activeSwapChainConfig();
    var tokens = config && config.tokens && Array.isArray(config.tokens.quotes) ? config.tokens.quotes : [];

    return tokens.filter(function (token) {
      return token && (token.native || isAddress(token.address));
    });
  }

  function tokenId(token) {
    return token && token.id ? token.id : token && token.symbol ? token.symbol : "";
  }

  function selectedQuoteToken(chain) {
    var quotes = quoteTokenConfigs(chain);
    var selected = quotes.find(function (token) {
      return tokenId(token) === swapUiState.quoteId;
    });

    if (!selected && quotes.length) {
      selected = quotes[0];
      swapUiState.quoteId = tokenId(selected);
    }

    return selected || null;
  }

  function currentSwapTokens(chain) {
    var config = chain || activeSwapChainConfig();
    var enten = outputTokenConfig(config);
    var quote = selectedQuoteToken(config);

    if (!enten || !quote) {
      return { pay: null, receive: null, quote: quote };
    }

    return swapUiState.reversed
      ? { pay: enten, receive: quote, quote: quote }
      : { pay: quote, receive: enten, quote: quote };
  }

  function setAssetSelector(selector, tokens, selectedToken) {
    var control = $(selector);
    var picker = control ? control.closest("[data-asset-picker]") : null;
    var menu = picker ? $("[data-asset-menu]", picker) : null;
    var label = control ? $("[data-asset-symbol-label]", control) : null;
    if (!control || !menu || !label) return;

    menu.innerHTML = "";
    tokens.forEach(function (token) {
      var option = document.createElement("button");
      var id = tokenId(token);

      option.type = "button";
      option.className = "asset-option";
      option.dataset.assetOption = id;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", selectedToken && tokenId(selectedToken) === id ? "true" : "false");
      if (selectedToken && tokenId(selectedToken) === id) {
        option.dataset.selected = "true";
      }
      option.innerHTML = "<span></span><span></span>";
      option.children[0].textContent = token.symbol;
      option.children[1].textContent = token.placeholder ? "placeholder" : "";
      option.addEventListener("click", function () {
        control.dataset.value = id;
        closeAssetMenus();
        control.dispatchEvent(
          new CustomEvent("assetchange", {
            detail: { value: id },
            bubbles: true
          })
        );
      });
      menu.appendChild(option);
    });

    if (selectedToken) {
      control.dataset.value = tokenId(selectedToken);
      label.textContent = selectedToken.symbol;
    }
    control.disabled = tokens.length < 2;
    if (tokens.length < 2) {
      control.setAttribute("data-fixed", "true");
    } else {
      control.removeAttribute("data-fixed");
    }
  }

  function closeAssetMenus(exceptPicker) {
    $all("[data-asset-picker]").forEach(function (picker) {
      var control = $("[aria-haspopup='listbox']", picker);
      var menu = $("[data-asset-menu]", picker);

      if (picker === exceptPicker) return;
      picker.removeAttribute("data-open");
      if (control) {
        control.setAttribute("aria-expanded", "false");
      }
      if (menu) {
        menu.hidden = true;
      }
    });
  }

  function toggleAssetMenu(control) {
    var picker = control ? control.closest("[data-asset-picker]") : null;
    var menu = picker ? $("[data-asset-menu]", picker) : null;
    var isOpen;

    if (!control || !picker || !menu || control.disabled) return;
    isOpen = !menu.hidden;
    closeAssetMenus(picker);
    menu.hidden = isOpen;
    if (isOpen) {
      picker.removeAttribute("data-open");
      control.setAttribute("aria-expanded", "false");
    } else {
      picker.dataset.open = "true";
      control.setAttribute("aria-expanded", "true");
    }
  }

  function setTokenName(selector, token) {
    setText(selector, token ? token.name : "--");
  }

  function setBalancePlaceholder(selector, token) {
    setText(selector, "Balance: 0 " + (token ? token.symbol : ""));
  }

  function updateSwapRouteLabels() {
    var pair = currentSwapTokens();

    if (!pair.pay || !pair.receive) return;
    setText("[data-route-label]", pair.pay.symbol + " → " + pair.receive.symbol + " (Kumbaya)");
  }

  function renderSwapControls() {
    var chain = activeSwapChainConfig();
    var quotes = quoteTokenConfigs(chain);
    var pair = currentSwapTokens(chain);
    var enten = outputTokenConfig(chain);
    var submit = $("[data-swap-submit]");

    if (!pair.pay || !pair.receive || !enten || !quotes.length) return;

    setAssetSelector("[data-pay-asset]", swapUiState.reversed ? [enten] : quotes, pair.pay);
    setAssetSelector("[data-receive-asset]", swapUiState.reversed ? quotes : [enten], pair.receive);
    setTokenName("[data-pay-name]", pair.pay);
    setTokenName("[data-receive-name]", pair.receive);
    setBalancePlaceholder("[data-pay-balance]", pair.pay);
    setBalancePlaceholder("[data-receive-balance]", pair.receive);
    updateSwapRouteLabels();

    if (submit) {
      submit.disabled = !SWAP_TRADING_ENABLED;
      submit.setAttribute("aria-disabled", SWAP_TRADING_ENABLED ? "false" : "true");
    }
  }

  async function tokenBalance(tokenAddress, account, chain) {
    return publicClientForChain(chain).readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account]
    });
  }

  async function walletTokenBalance(token, account, chain) {
    if (!token) return null;
    if (token.native) {
      return publicClientForChain(chain).getBalance({ address: account });
    }
    if (isAddress(token.address)) {
      return tokenBalance(token.address, account, chain);
    }
    return null;
  }

  function setFormattedBalance(selector, token, balance) {
    var label = "Balance: 0 " + (token ? token.symbol : "");

    if (token && balance !== null) {
      label = "Balance: " + formatUnits(balance, token.decimals, 4) + " " + token.symbol;
    }

    setText(selector, label);
  }

  async function loadSwapBalances() {
    var chain = currentChainConfig();
    var pair;
    var payBalance;
    var receiveBalance;

    if (!state.account || !$("[data-pay-balance]")) return;
    if (!chain) return;

    pair = currentSwapTokens(chain);
    if (!pair.pay || !pair.receive) return;

    try {
      payBalance = await walletTokenBalance(pair.pay, state.account, chain);
      receiveBalance = await walletTokenBalance(pair.receive, state.account, chain);
      setFormattedBalance("[data-pay-balance]", pair.pay, payBalance);
      setFormattedBalance("[data-receive-balance]", pair.receive, receiveBalance);
    } catch (error) {
      setStatus("[data-page-status]", "Connected, but balance reads failed on " + (chain ? chain.shortName : "this network") + ".", "warn");
    }
  }

  function formatUsdPrice(usd) {
    if (!usd || !usd.amount || usd.amount <= 0n) return "--";
    return "$" + formatUnits(usd.amount, usd.decimals, 6);
  }

  function swapKernelAddress(chain) {
    if (chain && chain.borrow && isAddress(chain.borrow.kernelAddress)) return chain.borrow.kernelAddress;
    if (chain && chain.presale && isAddress(chain.presale.kernelAddress)) return chain.presale.kernelAddress;
    return "";
  }

  // USD value backing one ENTEN if redeemed: backingPerToken (backing-asset amount
  // per ENTEN, from the kernel — same math the presale/borrow pages use) priced
  // through the backing asset's USD quote on Kumbaya. Returns a "$x" string or "--".
  async function readEntenBackingUsd(chain, enten) {
    var backingAsset = presaleBackingAssetConfig(chain);
    var kernel = swapKernelAddress(chain);

    if (!backingAsset || !isAddress(backingAsset.address) || !isAddress(kernel)) return "--";

    var results = await publicClientForChain(chain).multicall({
      allowFailure: true,
      contracts: [
        { address: enten.address, abi: ERC20_ABI, functionName: "totalSupply", args: [] },
        {
          address: kernel,
          abi: KERNEL_VIEW_ABI,
          functionName: "viewData",
          args: [backingStateSlots(backingAsset.address)]
        }
      ]
    });

    var totalSupply = results[0] && results[0].status === "success" ? results[0].result : null;
    var backingState = results[1] && results[1].status === "success" && Array.isArray(results[1].result) ? results[1].result : null;
    var backingPerToken = backingPerTokenFromState(backingState, totalSupply);
    if (backingPerToken === null) return "--";

    var assetUsd = await readAssetUsdPrice(chain, backingAsset.address);
    if (!assetUsd || !assetUsd.amount || assetUsd.amount <= 0n) return "--";

    // backingPerToken is backing-asset wei per 1 ENTEN; assetUsd.amount is USD wei
    // per 1 whole backing token, so normalise by WAD to get USD wei per ENTEN.
    return "$" + formatUnits((backingPerToken * assetUsd.amount) / WAD, assetUsd.decimals, 6);
  }

  // Market context for the swap page: the live ENTEN price in USDm and the USD
  // value backing one ENTEN on redemption. Works pre-connect over the chain RPC.
  async function loadSwapMarketPrices() {
    var chain = activeSwapChainConfig();
    var kumbaya = kumbayaConfig(chain);
    var enten = outputTokenConfig(chain);

    if (!chain || !kumbaya || !enten || !isAddress(enten.address) || !$("[data-enten-price]")) return;

    try {
      setText("[data-enten-price]", formatUsdPrice(await readAssetUsdPrice(chain, enten.address)));
    } catch (error) {
      setText("[data-enten-price]", "--");
    }

    try {
      setText("[data-enten-backing]", await readEntenBackingUsd(chain, enten));
    } catch (error) {
      setText("[data-enten-backing]", "--");
    }
  }

  function canRouteToken(token) {
    return token && (token.native || isAddress(token.address));
  }

  // Kumbaya is a Uniswap V3 fork. ENTEN only has a pool against USDm, so every
  // non-USDm quote token (e.g. MEGA) routes through USDm as an intermediate hop.
  // The quote token is whichever side of the pair is not ENTEN.
  function swapRouteTokens(chain, payToken, receiveToken) {
    var kumbaya = kumbayaConfig(chain);
    var enten = outputTokenConfig(chain);
    var usd = kumbaya && kumbaya.usdToken ? kumbaya.usdToken : null;

    if (!enten || !usd || !payToken || !receiveToken) return null;
    if (!isAddress(payToken.address) || !isAddress(receiveToken.address)) return null;
    if (!isAddress(enten.address) || !isAddress(usd.address)) return null;

    var payIsEnten = payToken.address.toLowerCase() === enten.address.toLowerCase();
    var quote = payIsEnten ? receiveToken : payToken;
    // Both sides ENTEN, or neither side ENTEN — not a routable Enten swap.
    if (quote.address.toLowerCase() === enten.address.toLowerCase()) return null;
    if (!payIsEnten && receiveToken.address.toLowerCase() !== enten.address.toLowerCase()) return null;

    // Canonical chain runs quote -> ENTEN; reverse it when selling ENTEN.
    var canonical =
      quote.address.toLowerCase() === usd.address.toLowerCase()
        ? [usd.address, enten.address]
        : [quote.address, usd.address, enten.address];

    return payIsEnten ? canonical.slice().reverse() : canonical;
  }

  // Uniswap V3 path: token0 (20 bytes) + fee0 (uint24, 3 bytes) + token1 + fee1 + ...
  function encodeV3Path(tokens, fees) {
    var path = "0x";
    for (var i = 0; i < tokens.length; i += 1) {
      path += tokens[i].toLowerCase().replace(/^0x/, "");
      if (i < fees.length) {
        path += fees[i].toString(16).padStart(6, "0");
      }
    }
    return path;
  }

  // Every combination of fee tiers across `hops` hops (cartesian product).
  function feeTierCombos(feeTiers, hops) {
    var combos = [[]];
    for (var h = 0; h < hops; h += 1) {
      var next = [];
      combos.forEach(function (combo) {
        feeTiers.forEach(function (fee) {
          next.push(combo.concat([fee]));
        });
      });
      combos = next;
    }
    return combos;
  }

  // Quotes every candidate path/fee combination through the Kumbaya QuoterV2 in a
  // single multicall and keeps the one with the largest output. Returns
  // { amountOut, tokens, fees } or null when no pool can fill the trade.
  async function quoteBestKumbayaSwap(chain, payToken, receiveToken, amountIn) {
    var kumbaya = kumbayaConfig(chain);
    if (!kumbaya || !isAddress(kumbaya.quoterV2) || amountIn <= 0n) return null;

    var tokens = swapRouteTokens(chain, payToken, receiveToken);
    if (!tokens) return null;

    var feeTiers = Array.isArray(kumbaya.feeTiers) && kumbaya.feeTiers.length ? kumbaya.feeTiers : [3000];
    var combos = feeTierCombos(feeTiers, tokens.length - 1);
    var client = publicClientForChain(chain);
    var results;

    try {
      results = await client.multicall({
        allowFailure: true,
        contracts: combos.map(function (fees) {
          return {
            address: kumbaya.quoterV2,
            abi: QUOTER_V2_ABI,
            functionName: "quoteExactInput",
            args: [encodeV3Path(tokens, fees), amountIn]
          };
        })
      });
    } catch (error) {
      return null;
    }

    var best = null;
    results.forEach(function (result, index) {
      if (!result || result.status !== "success" || !result.result) return;
      var out = BigInt(result.result[0] || 0);
      if (out > 0n && (!best || out > best.amountOut)) {
        best = { amountOut: out, tokens: tokens, fees: combos[index] };
      }
    });

    return best;
  }

  function applySlippage(amountOut, bps) {
    var min = (amountOut * BigInt(10000 - bps)) / 10000n;
    return min > 0n ? min : 1n;
  }

  function buildKumbayaSwapData(best, recipient, amountIn, amountOutMin) {
    if (best.fees.length === 1) {
      return encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: best.tokens[0],
            tokenOut: best.tokens[1],
            fee: best.fees[0],
            recipient: recipient,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0n
          }
        ]
      });
    }

    return encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInput",
      args: [
        {
          path: encodeV3Path(best.tokens, best.fees),
          recipient: recipient,
          amountIn: amountIn,
          amountOutMinimum: amountOutMin
        }
      ]
    });
  }

  function feeTierLabel(fee) {
    return (fee / 10000).toFixed(2).replace(/\.?0+$/, "") + "%";
  }

  function renderSwapQuoteMeta(chain, pair, amountIn, best) {
    var symbols = best.tokens.map(function (address) {
      var token = tokenConfigForAddress(chain, address);
      return token ? token.symbol : shortenAddress(address);
    });
    var feeLabels = best.fees.map(feeTierLabel).join(" · ");

    setText("[data-route-label]", symbols.join(" → ") + " (" + feeLabels + ")");

    var rate = "--";
    if (amountIn > 0n) {
      var oneUnit = 10n ** BigInt(pair.pay.decimals);
      var perUnit = (best.amountOut * oneUnit) / amountIn;
      rate = "1 " + pair.pay.symbol + " ≈ " + formatUnits(perUnit, pair.receive.decimals, 6) + " " + pair.receive.symbol;
    }
    setText("[data-price-label]", rate);
  }

  function clearSwapQuote() {
    swapUiState.lastQuote = null;
    var receiveInput = $("[data-receive-input]");
    if (receiveInput) receiveInput.value = "";
    updateSwapRouteLabels();
    setText("[data-price-label]", "Enter an amount for a live quote");
  }

  // Debounced live quote driven by the pay input. Caches the winning route so the
  // submit handler reuses it (and re-quotes fresh anyway before sending).
  function scheduleSwapQuote() {
    if (swapQuoteTimer) window.clearTimeout(swapQuoteTimer);
    swapQuoteTimer = window.setTimeout(refreshSwapQuote, 350);
  }

  async function refreshSwapQuote() {
    var chain = activeSwapChainConfig();
    var pair = currentSwapTokens(chain);
    var input = $("[data-pay-input]");
    var receiveInput = $("[data-receive-input]");

    swapUiState.lastQuote = null;
    if (!chain || !kumbayaConfig(chain) || !pair.pay || !pair.receive) return;

    var amountIn = parseUnits(input ? input.value : "", pair.pay.decimals);
    if (amountIn <= 0n) {
      clearSwapQuote();
      return;
    }

    var payId = tokenId(pair.pay);
    var receiveId = tokenId(pair.receive);
    setText("[data-price-label]", "Fetching best route...");

    var best;
    try {
      best = await quoteBestKumbayaSwap(chain, pair.pay, pair.receive, amountIn);
    } catch (error) {
      best = null;
    }

    // The user may have flipped or switched tokens while the quote was in flight.
    var current = currentSwapTokens(activeSwapChainConfig());
    if (tokenId(current.pay) !== payId || tokenId(current.receive) !== receiveId) return;

    if (!best) {
      if (receiveInput) receiveInput.value = "";
      setText("[data-price-label]", "No route for this size");
      return;
    }

    swapUiState.lastQuote = { best: best, amountIn: amountIn, payId: payId, receiveId: receiveId };
    if (receiveInput) receiveInput.value = formatUnits(best.amountOut, pair.receive.decimals, 6);
    renderSwapQuoteMeta(chain, pair, amountIn, best);
  }

  async function ensureKumbayaApproval(chain, payToken, amountIn) {
    var router = chain.kumbaya.swapRouter;
    var allowance;
    var approvalTx;
    var txHash;
    var receipt;

    try {
      allowance = await tokenAllowance(payToken.address, state.account, router, chain);
    } catch (error) {
      setStatus("[data-page-status]", "Could not read " + payToken.symbol + " allowance.", "warn");
      return false;
    }

    if (allowance >= amountIn) return true;

    approvalTx = buildApproveTokenTransaction(payToken.address, router, amountIn);

    setStatus("[data-page-status]", "Simulating " + payToken.symbol + " approval...", "warn");
    try {
      await simulateTransaction(approvalTx, chain);
    } catch (error) {
      setStatus("[data-page-status]", payToken.symbol + " approval preflight failed: " + simulationFailureMessage(error), "warn");
      return false;
    }

    setStatus("[data-page-status]", "Approving " + payToken.symbol + " for the Kumbaya router...", "warn");
    txHash = await sendTransaction(approvalTx, chain);

    setStatus("[data-page-status]", "Waiting for " + payToken.symbol + " approval...", "warn");
    receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", payToken.symbol + " approval is still pending. Try again once it confirms.", "warn");
      return false;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", payToken.symbol + " approval reverted.", "warn");
      return false;
    }
    return true;
  }

  async function submitKumbayaSwap() {
    var chain = currentChainConfig();
    var kumbaya = chain ? kumbayaConfig(chain) : null;
    var pair = chain ? currentSwapTokens(chain) : { pay: null, receive: null };
    var input = $("[data-pay-input]");
    var amountIn;
    var best;
    var amountOutMin;
    var swapTx;
    var txHash;

    if (!SWAP_TRADING_ENABLED) {
      setStatus("[data-page-status]", SWAP_UNAVAILABLE_MESSAGE, "warn");
      return;
    }

    if (!chain || !kumbaya || !isAddress(kumbaya.swapRouter)) {
      setStatus("[data-page-status]", SWAP_UNAVAILABLE_MESSAGE, "warn");
      return;
    }

    if (!pair.pay || !pair.receive || !canRouteToken(pair.pay) || !canRouteToken(pair.receive)) {
      setStatus("[data-page-status]", "Select tokens with Kumbaya liquidity.", "warn");
      return;
    }

    amountIn = parseUnits(input ? input.value : "", pair.pay.decimals);
    if (amountIn <= 0n) {
      setStatus("[data-page-status]", "Enter an amount to swap.", "warn");
      return;
    }

    // Always re-quote immediately before building calldata so the minimum-output
    // bound reflects current pool state rather than a stale debounced quote.
    setStatus("[data-page-status]", "Fetching the best Kumbaya route...", "warn");
    best = await quoteBestKumbayaSwap(chain, pair.pay, pair.receive, amountIn);
    if (!best) {
      setStatus("[data-page-status]", "No Kumbaya route is available for this pair right now.", "warn");
      return;
    }

    var receiveInput = $("[data-receive-input]");
    if (receiveInput) receiveInput.value = formatUnits(best.amountOut, pair.receive.decimals, 6);
    renderSwapQuoteMeta(chain, pair, amountIn, best);

    amountOutMin = applySlippage(best.amountOut, swapUiState.slippageBps);
    swapTx = {
      from: state.account,
      to: kumbaya.swapRouter,
      data: buildKumbayaSwapData(best, state.account, amountIn, amountOutMin),
      value: "0x0"
    };

    if (isMossWallet()) {
      // MOSS rejects two sequential callContract calls, so batch approve + swap into
      // one atomic userOp. With an approve in the batch the swap can't be simulated
      // standalone (allowance isn't set yet); rely on the batch reverting as a whole.
      var batch = [];
      var allowance;
      try {
        allowance = await tokenAllowance(pair.pay.address, state.account, kumbaya.swapRouter, chain);
      } catch (error) {
        setStatus("[data-page-status]", "Could not read " + pair.pay.symbol + " allowance.", "warn");
        return;
      }
      if (allowance < amountIn) {
        batch.push(buildApproveTokenTransaction(pair.pay.address, kumbaya.swapRouter, amountIn));
      }
      batch.push(swapTx);

      if (batch.length === 1) {
        setStatus("[data-page-status]", "Simulating swap...", "warn");
        try {
          await simulateTransaction(swapTx, chain);
        } catch (error) {
          setStatus("[data-page-status]", "Swap preflight failed: " + simulationFailureMessage(error), "warn");
          return;
        }
      }

      setStatus("[data-page-status]", batch.length > 1 ? "Submitting approve + swap..." : "Submitting swap...", "warn");
      txHash = await mossSendCalls(batch);
    } else {
      if (!(await ensureKumbayaApproval(chain, pair.pay, amountIn))) return;

      setStatus("[data-page-status]", "Simulating swap...", "warn");
      try {
        await simulateTransaction(swapTx, chain);
      } catch (error) {
        setStatus("[data-page-status]", "Swap preflight failed: " + simulationFailureMessage(error), "warn");
        return;
      }

      setStatus("[data-page-status]", "Submitting swap...", "warn");
      txHash = await sendTransaction(swapTx, chain);
    }

    setStatus("[data-page-status]", "Swap submitted: " + txHash.slice(0, 10) + "... waiting for confirmation.", "ok");
    refreshSwapBalancesSoon();

    var receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", "Swap submitted and still pending. Balances will update on the next wallet refresh.", "warn");
      return;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", "Swap reverted.", "warn");
      return;
    }

    setStatus("[data-page-status]", "Swap confirmed: " + txHash.slice(0, 10) + "...", "ok");
    loadSwapBalances();
    loadSwapMarketPrices();
  }

  function tokenConfigForAddress(chain, address) {
    var normalized = String(address || "").toLowerCase();
    var tokens = [];

    if (!chain || !isAddress(address)) return null;
    if (isNativeAssetAddress(address)) {
      return (
        chain.tokens &&
        Array.isArray(chain.tokens.quotes) &&
        chain.tokens.quotes.find(function (token) {
          return token && token.native;
        })
      ) || {
        id: chain.nativeCurrency.symbol,
        address: NATIVE_TOKEN_ADDRESS,
        symbol: chain.nativeCurrency.symbol,
        name: chain.nativeCurrency.name,
        decimals: chain.nativeCurrency.decimals,
        native: true
      };
    }

    if (chain.tokens && chain.tokens.enten) {
      tokens.push(chain.tokens.enten);
    }
    if (chain.tokens && Array.isArray(chain.tokens.quotes)) {
      tokens = tokens.concat(chain.tokens.quotes);
    }

    return (
      tokens.find(function (token) {
        return token && isAddress(token.address) && token.address.toLowerCase() === normalized;
      }) || null
    );
  }

  function assetDisplay(chain, item, precision) {
    var token = tokenConfigForAddress(chain, item.address);
    var decimals = token ? token.decimals : 18;
    var symbol = token ? token.symbol : shortenAddress(item.address);

    return {
      value: precision === "compact" ? formatUnitsCompact(item.amount, decimals) : formatUnits(item.amount, decimals, precision || 4),
      unit: symbol
    };
  }

  function setAssetMetric(valueSelector, unitSelector, chain, items, fallbackValue, fallbackUnit) {
    var first;
    var display;
    var unit;

    if (!items || !items.length) {
      setText(valueSelector, fallbackValue || "--");
      setText(unitSelector, fallbackUnit || "");
      return;
    }

    first = items[0];
    display = assetDisplay(chain, first, "compact");
    unit = display.unit;
    if (items.length > 1) {
      unit += " +" + (items.length - 1);
    }

    setText(valueSelector, display.value);
    setText(unitSelector, unit);
  }

  function presaleConfig(chain) {
    return chain && chain.presale ? chain.presale : {};
  }

  function presaleMintDecimals(chain) {
    var config = presaleConfig(chain);
    return config.mintDecimals === undefined ? 18 : config.mintDecimals;
  }

  function presaleDeadlineSeconds(chain) {
    var config = presaleConfig(chain);
    return config.deadlineSeconds || 1200;
  }

  function presaleMaxPaymentBufferBps(chain) {
    var config = presaleConfig(chain);
    var bps = Number(config.maxPaymentBufferBps || 0);
    return Number.isFinite(bps) && bps > 0 ? Math.floor(bps) : 0;
  }

  function paymentAmountWithBuffer(payment, bps) {
    var amount = BigInt(payment || 0);
    if (!bps) return amount;
    return amount + (amount * BigInt(bps) + 9999n) / 10000n;
  }

  function normalizePresaleQuote(value) {
    value = value || [];
    return {
      payment: BigInt(value.payment !== undefined ? value.payment : value[0] || 0),
      spotPrice: BigInt(value.spotPrice !== undefined ? value.spotPrice : value[1] || 0),
      nextPremium: BigInt(value.nextPremium !== undefined ? value.nextPremium : value[2] || 0)
    };
  }

  async function readPresaleQuote(chain, amount) {
    return normalizePresaleQuote(
      await publicClientForChain(chain).readContract({
        address: presaleAddress(chain),
        abi: PRESALE_AUCTION_ABI,
        functionName: "quote",
        args: [amount]
      })
    );
  }

  function presalePaymentEstimateText(chain, payment) {
    var display;

    if (!presaleUiState.assetAddress || payment === null || payment === undefined) {
      return "Estimated spend unavailable";
    }

    display = assetDisplay(
      chain,
      {
        address: presaleUiState.assetAddress,
        amount: BigInt(payment || 0)
      },
      6
    );

    return "Estimated spend: " + display.value + " " + display.unit;
  }

  function setPresalePriceMetric(chain, price, assetAddress) {
    if (price === null || price === undefined || !isAddress(assetAddress)) {
      setAssetMetric("[data-auction-currentPrice]", "[data-auction-currentPrice-unit]", chain, [], "--", "");
      return;
    }

    setAssetMetric(
      "[data-auction-currentPrice]",
      "[data-auction-currentPrice-unit]",
      chain,
      [{ address: assetAddress, amount: BigInt(price || 0) }],
      "--",
      ""
    );
  }

  function setPresalePreviewText(text) {
    setText("[data-auction-payment-estimate]", text);
    setText("[data-auction-payment-total]", paymentEstimateValueText(text));
  }

  // Renders the "MEGA per ENTEN" price ratio and "Total MEGA Raised" stat cards.
  // price is ASSET-per-ENTEN (WAD); totalCommitted is the cumulative ASSET raised.
  // Both use the presale's ASSET token (MEGA) for decimals + symbol.
  function renderPresaleExtraMetrics(chain) {
    var assetAddress = presaleUiState.assetAddress;
    var hasAsset = isAddress(assetAddress);
    var minPrice = presaleUiState.minPrice;
    var backingPerToken = presaleUiState.backingPerToken;
    var raised = presaleUiState.totalCommitted;
    var display;

    // minimumPrice() is the grossed-up sale floor. It is intentionally higher
    // than backing per token so the backing share of the payment preserves NAV.
    if (hasAsset && minPrice !== null && minPrice !== undefined) {
      display = assetDisplay(chain, { address: assetAddress, amount: minPrice }, 6);
      setText("[data-presale-min-price]", display.value);
      setText("[data-presale-min-price-unit]", display.unit + " / ENTEN");
    } else {
      setText("[data-presale-min-price]", "--");
      setText("[data-presale-min-price-unit]", "");
    }

    if (hasAsset && backingPerToken !== null && backingPerToken !== undefined) {
      display = assetDisplay(chain, { address: assetAddress, amount: backingPerToken }, 6);
      setText("[data-presale-backing]", display.value);
      setText("[data-presale-backing-unit]", display.unit + " / ENTEN");
    } else {
      setText("[data-presale-backing]", "--");
      setText("[data-presale-backing-unit]", "");
    }

    if (hasAsset && raised !== null && raised !== undefined) {
      display = assetDisplay(chain, { address: assetAddress, amount: raised }, "compact");
      setText("[data-presale-total-raised]", display.value);
      setText("[data-presale-total-raised-unit]", display.unit);
    } else {
      setText("[data-presale-total-raised]", "--");
      setText("[data-presale-total-raised-unit]", "");
    }
  }

  function kumbayaConfig(chain) {
    return chain && chain.kumbaya ? chain.kumbaya : null;
  }

  function usdTokenDecimals(usdToken) {
    return usdToken && usdToken.decimals !== undefined ? usdToken.decimals : 18;
  }

  // Returns the USD value of one whole ASSET token (e.g. MEGA), expressed in the USD reference
  // token's smallest units, by quoting ASSET -> USD across Kumbaya pools and taking the best output.
  async function readAssetUsdPrice(chain, assetAddress) {
    var kumbaya = kumbayaConfig(chain);
    var usd = kumbaya ? kumbaya.usdToken : null;
    var decimals;
    var feeTiers;
    var oneAsset;
    var client;
    var best = 0n;
    var quotes;

    if (!kumbaya || !isAddress(kumbaya.quoterV2) || !usd || !isAddress(usd.address) || !isAddress(assetAddress)) {
      return null;
    }

    decimals = usdTokenDecimals(usd);

    // ASSET is the same as the USD reference: one token is worth exactly one unit of USD.
    if (assetAddress.toLowerCase() === usd.address.toLowerCase()) {
      return { amount: 10n ** BigInt(decimals), decimals: decimals };
    }

    feeTiers = Array.isArray(kumbaya.feeTiers) && kumbaya.feeTiers.length ? kumbaya.feeTiers : [3000];
    oneAsset = 10n ** 18n; // MEGA uses 18 decimals.
    client = publicClientForChain(chain);

    // Quote 1 ASSET -> USD across every fee tier in a single multicall, then keep the best output.
    // An exact-input sell returns less from thin/empty pools, so the max output is the fair price.
    try {
      quotes = await client.multicall({
        allowFailure: true,
        contracts: feeTiers.map(function (fee) {
          return {
            address: kumbaya.quoterV2,
            abi: QUOTER_V2_ABI,
            functionName: "quoteExactInputSingle",
            args: [
              {
                tokenIn: assetAddress,
                tokenOut: usd.address,
                amountIn: oneAsset,
                fee: fee,
                sqrtPriceLimitX96: 0n
              }
            ]
          };
        })
      });
    } catch (error) {
      return null;
    }

    quotes.forEach(function (quote) {
      if (quote && quote.status === "success" && quote.result) {
        var out = BigInt(quote.result[0] || 0);
        if (out > best) best = out;
      }
    });

    if (best <= 0n) return null;
    return { amount: best, decimals: decimals };
  }

  // Renders the Circulating and Fully Diluted (FDV) USD readouts from the current presale price
  // (ASSET per ENTEN, WAD) and the cached ASSET/USD price.
  function renderPresaleValuation(chain) {
    var kumbaya = kumbayaConfig(chain) || {};
    var usdPrice = presaleUiState.assetUsdPrice;
    var price = presaleUiState.price;
    var usdScale;
    var perTokenUsdWad;
    var circulatingSupply;
    var fdvSupply;

    if (!usdPrice || !usdPrice.amount || price === null || price === undefined || price <= 0n) {
      setText("[data-presale-circulating]", "--");
      setText("[data-presale-fdv]", "--");
      return;
    }

    usdScale = 10n ** BigInt(usdTokenDecimals(usdPrice));
    // price (WAD ASSET/ENTEN) * assetUsd (USD per ASSET) / usdScale = USD per ENTEN, scaled by WAD.
    perTokenUsdWad = (price * usdPrice.amount) / usdScale;
    circulatingSupply = BigInt(kumbaya.circulatingSupply || 1000000);
    fdvSupply = BigInt(kumbaya.fdvSupply || 10000000);

    setText("[data-presale-circulating]", "$" + formatUnitsCompact(perTokenUsdWad * circulatingSupply, 18));
    setText("[data-presale-fdv]", "$" + formatUnitsCompact(perTokenUsdWad * fdvSupply, 18));
  }

  function ceilDivBig(a, b) {
    return (a + b - 1n) / b;
  }

  function presaleInputMode() {
    return presaleUiState.inputMode === "mega" ? "mega" : "enten";
  }

  function presaleAssetDecimals(chain) {
    var token = isAddress(presaleUiState.assetAddress) ? tokenConfigForAddress(chain, presaleUiState.assetAddress) : null;
    return token && token.decimals !== undefined ? token.decimals : 18;
  }

  function presaleAssetSymbol(chain) {
    if (!isAddress(presaleUiState.assetAddress)) return "MEGA";
    return assetDisplay(chain, { address: presaleUiState.assetAddress, amount: 0n }, 4).unit;
  }

  function entenSymbolFor(chain) {
    return chain && chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN";
  }

  // Exact JS port of PresaleAuction.quote()'s payment math (floor term + bonding-curve
  // premium), so we can price an ENTEN amount client-side without an RPC round-trip.
  // Validated against the live contract at a pinned block. Returns null if state is
  // unavailable or the amount is out of range.
  function presaleQuotePaymentLocal(amount) {
    var WAD = 1000000000000000000n;
    var minimum = presaleUiState.minPrice;
    var price = presaleUiState.price;
    var remaining = presaleUiState.remainingLot;
    var virtualReserve = presaleUiState.virtualReserve;

    if (minimum === null || price === null || remaining === null || virtualReserve === null) return null;
    if (amount <= 0n || amount > remaining) return null;

    var floorPart = ceilDivBig(amount * minimum, WAD);
    var premium = price > minimum ? price - minimum : 0n;
    if (premium <= 0n) return floorPart;

    var tokenReserve = virtualReserve + remaining;
    var nextReserve = tokenReserve - amount;
    if (nextReserve <= 0n) return null;
    var quoteReserve = ceilDivBig(premium * tokenReserve, WAD);
    var premiumPayment = ceilDivBig(quoteReserve * amount, nextReserve);
    return floorPart + premiumPayment;
  }

  // Inverts the quote: the largest ENTEN amount whose payment is <= the given spend
  // (the asset/MEGA budget). Binary search over the exact local quote — fast, no RPC.
  function estimateEntenForSpend(spend) {
    var remaining = presaleUiState.remainingLot;
    var lo = 0n;
    var hi;
    var mid;
    var cost;
    var fullCost;

    if (spend <= 0n || remaining === null || remaining <= 0n) return null;
    if (presaleUiState.minPrice === null || presaleUiState.price === null || presaleUiState.virtualReserve === null) return null;

    // If the entire remaining lot fits the budget, you can take all of it.
    fullCost = presaleQuotePaymentLocal(remaining);
    if (fullCost !== null && fullCost <= spend) return remaining;

    hi = remaining;
    while (lo < hi) {
      mid = (lo + hi + 1n) / 2n;
      cost = presaleQuotePaymentLocal(mid);
      if (cost !== null && cost <= spend) {
        lo = mid;
      } else {
        hi = mid - 1n;
      }
    }
    return lo > 0n ? lo : null;
  }

  function setPresaleInputMode(mode) {
    var next = mode === "mega" ? "mega" : "enten";
    var chain = activePresaleChainConfig();
    var input = $("#bidAmount");
    var assetSym = presaleAssetSymbol(chain);

    presaleUiState.inputMode = next;

    $all("[data-presale-mode]").forEach(function (btn) {
      var active = btn.getAttribute("data-presale-mode") === next;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (next === "mega") {
      setText("[data-presale-input-label]", "Amount to Spend (" + assetSym + ")");
      setText("[data-presale-input-unit]", assetSym);
      setText("[data-presale-cost-label]", "Estimated " + entenSymbolFor(chain) + " Received");
      if (input) input.setAttribute("placeholder", "5000");
    } else {
      setText("[data-presale-input-label]", "Allocation Required (" + entenSymbolFor(chain) + ")");
      setText("[data-presale-input-unit]", "Tokens");
      setText("[data-presale-cost-label]", "Total Estimated Cost");
      if (input) input.setAttribute("placeholder", "10000");
    }

    if (input) input.value = "";
    setText("[data-presale-secondary-estimate]", "");
    updatePresaleMaxControl();
    updatePresalePaymentPreview();
  }

  // MEGA-spend mode: you type how much ASSET (MEGA) to spend, and the output card shows
  // the ENTEN you'd receive for it (settled exactly on-chain by buy()).
  function updatePresaleSpendPreview(chain, input) {
    var assetDecimals = presaleAssetDecimals(chain);
    var entenSym = entenSymbolFor(chain);
    var spend = 0n;
    var enten;

    if (input && input.value) spend = parseUnits(input.value, assetDecimals);

    if (!spend || spend <= 0n) {
      setText("[data-auction-payment-total]", "--");
      setText("[data-presale-secondary-estimate]", "");
      return;
    }

    if (!chain || !presaleAddress(chain) || !presaleUiState.assetAddress) {
      setText("[data-auction-payment-total]", "Unavailable");
      setText("[data-presale-secondary-estimate]", "");
      return;
    }

    enten = estimateEntenForSpend(spend);
    if (enten === null || enten <= 0n) {
      setText("[data-auction-payment-total]", "--");
      setText("[data-presale-secondary-estimate]", "Amount too small to receive " + entenSym);
      return;
    }

    setText("[data-auction-payment-total]", groupedNumber(formatUnits(enten, presaleUiState.mintDecimals, 2)) + " " + entenSym);

    if (
      presaleUiState.minBid !== null &&
      enten < presaleUiState.minBid &&
      enten !== presaleUiState.remainingLot
    ) {
      setText(
        "[data-presale-secondary-estimate]",
        "Below " + groupedNumber(formatUnits(presaleUiState.minBid, presaleUiState.mintDecimals, 2)) + " " + entenSym + " minimum"
      );
    } else {
      setText("[data-presale-secondary-estimate]", "");
    }
  }

  function updatePresalePaymentPreview() {
    var chain = activePresaleChainConfig();
    var input = $("#bidAmount");
    var amount = 0n;
    var decimals = presaleUiState.mintDecimals;
    var requestId;

    if (presaleUiState.quoteTimer) {
      window.clearTimeout(presaleUiState.quoteTimer);
      presaleUiState.quoteTimer = null;
    }

    if (presaleInputMode() === "mega") {
      updatePresaleSpendPreview(chain, input);
      return;
    }

    setText("[data-presale-secondary-estimate]", "");

    if (input && input.value) {
      amount = parseUnits(input.value, decimals);
    }

    if (!amount || amount <= 0n) {
      setPresalePreviewText("Estimated spend: --");
      return;
    }

    if (presaleUiState.remainingLot !== null && amount > presaleUiState.remainingLot) {
      setPresalePreviewText("Exceeds available lot");
      return;
    }

    if (!chain || !presaleAddress(chain) || !presaleUiState.assetAddress) {
      setPresalePreviewText("Estimated spend unavailable");
      return;
    }

    // Don't flash a "Quoting..." placeholder. The estimate is re-quoted on every
    // 3s data refresh; showing a transient placeholder each tick made the preview
    // jump. Keep the previous value visible and swap it in place when the new
    // quote resolves (the requestId guard below discards stale results) — matching
    // the auction preview, which updates silently.
    requestId = ++presaleUiState.quoteRequestId;
    presaleUiState.quoteTimer = window.setTimeout(async function () {
      var estimate;
      var quote;

      try {
        quote = await readPresaleQuote(chain, amount);
      } catch (error) {
        if (requestId !== presaleUiState.quoteRequestId) return;
        setPresalePreviewText("Estimated spend unavailable");
        return;
      }

      if (requestId !== presaleUiState.quoteRequestId) return;
      estimate = presalePaymentEstimateText(chain, quote.payment);
      setPresalePreviewText(estimate);

      if (quote.spotPrice > 0n) {
        presaleUiState.price = quote.spotPrice;
        setPresalePriceMetric(chain, quote.spotPrice, presaleUiState.assetAddress);
        renderPresaleValuation(chain);
        renderPresaleExtraMetrics(chain);
      }
    }, 250);
  }

  function paymentEstimateText(chain, amount) {
    var prices = auctionUiState.prices || [];
    var mintDecimals = auctionUiState.mintDecimals;
    var payments;

    if (!amount || amount <= 0n) return "Estimated spend: --";
    if (!prices.length) return "Estimated spend unavailable";

    payments = paymentsForMintAmount(prices, amount, mintDecimals).filter(function (payment) {
      return payment.amount > 0n;
    });

    if (!payments.length) return "Estimated spend: --";

    return (
      "Estimated spend: " +
      payments
        .map(function (payment) {
          var display = assetDisplay(chain, payment, 6);
          return display.value + " " + display.unit;
        })
        .join(" + ")
    );
  }

  function paymentEstimateValueText(estimate) {
    if (estimate === "Estimated spend unavailable") return "Unavailable";
    if (estimate === "Exceeds available lot") return "Exceeds available";
    return String(estimate || "").replace(/^Estimated spend:\s*/, "") || "--";
  }

  function updateAuctionPaymentPreview() {
    var chain = activeAuctionChainConfig();
    var input = $("#bidAmount");
    var amount = 0n;
    var decimals = auctionUiState.mintDecimals;
    var estimate = "Estimated spend: --";

    if (input && input.value) {
      amount = parseUnits(input.value, decimals);
    }

    if (auctionUiState.remainingLot !== null && amount > auctionUiState.remainingLot) {
      estimate = "Exceeds available lot";
    } else if (chain) {
      estimate = paymentEstimateText(chain, amount);
    }

    setText("[data-auction-payment-estimate]", estimate);
    setText("[data-auction-payment-total]", paymentEstimateValueText(estimate));
  }

  function updateAuctionMaxControl() {
    var hasRemaining = auctionUiState.remainingLot !== null && auctionUiState.remainingLot > 0n;

    $all("[data-auction-max-amount], [data-auction-buy-max]").forEach(function (button) {
      button.disabled = !hasRemaining;
    });
  }

  function setAuctionAmountToMax() {
    var input = $("#bidAmount");

    if (!input || auctionUiState.remainingLot === null || auctionUiState.remainingLot <= 0n) return false;

    input.value = formatUnitsForInput(auctionUiState.remainingLot, auctionUiState.mintDecimals);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function updatePresaleMaxControl() {
    var hasRemaining = presaleUiState.remainingLot !== null && presaleUiState.remainingLot > 0n;

    $all("[data-auction-max-amount], [data-auction-buy-max]").forEach(function (button) {
      button.disabled = !hasRemaining;
    });
  }

  async function setPresaleAmountToMax() {
    var input = $("#bidAmount");
    var chain;
    var balance;

    if (!input) return false;

    if (presaleInputMode() === "mega") {
      // Max spend = the full MEGA balance in the connected wallet.
      chain = activePresaleChainConfig();
      if (!chain || !isAddress(presaleUiState.assetAddress)) return false;
      if (!state.account && !(await connectWallet())) return false;

      try {
        balance = await tokenBalance(presaleUiState.assetAddress, state.account, chain);
      } catch (error) {
        setStatus("[data-page-status]", "Could not read your " + presaleAssetSymbol(chain) + " balance.", "warn");
        return false;
      }

      if (balance === null || balance === undefined || BigInt(balance) <= 0n) {
        setStatus("[data-page-status]", "No " + presaleAssetSymbol(chain) + " balance available to spend.", "warn");
        return false;
      }

      // Truncate to 3 decimals so it's readable and never rounds above the real balance.
      input.value = formatUnits(BigInt(balance), presaleAssetDecimals(chain), 3);
    } else {
      if (presaleUiState.remainingLot === null || presaleUiState.remainingLot <= 0n) return false;
      input.value = formatUnitsForInput(presaleUiState.remainingLot, presaleUiState.mintDecimals);
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function formatDuration(seconds) {
    var total = Math.max(0, Number(seconds || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;

    return [hours, minutes, secs]
      .map(function (part) {
        return String(part).padStart(2, "0");
      })
      .join(":");
  }

  function setStartNextAuctionVisible(visible) {
    $all("[data-auction-start-next]").forEach(function (button) {
      button.hidden = !visible;
    });
  }

  function startAuctionCountdown(endTime, soldOut) {
    function tick() {
      var now = BigInt(Math.floor(Date.now() / 1000));
      var remaining = endTime > now ? endTime - now : 0n;
      var canStartNext = Boolean(soldOut) || remaining === 0n;

      setText("[data-auction-timeLeft]", formatDuration(remaining));
      setText("[data-auction-timeLeft-unit]", remaining > 0n ? "remaining" : "ended");
      setStartNextAuctionVisible(canStartNext);

      if (remaining === 0n && auctionCountdownTimer) {
        window.clearInterval(auctionCountdownTimer);
        auctionCountdownTimer = null;
      }
    }

    if (auctionCountdownTimer) {
      window.clearInterval(auctionCountdownTimer);
    }

    tick();
    auctionCountdownTimer = window.setInterval(tick, 1000);
  }

  function startPresaleCountdown(startTime, duration, soldOut, isActive) {
    function tick() {
      var now = BigInt(Math.floor(Date.now() / 1000));
      var endTime;
      var remaining;

      setStartNextAuctionVisible(false);

      if (!startTime || startTime <= 0n) {
        setText("[data-auction-timeLeft]", "--:--:--");
        setText("[data-auction-timeLeft-unit]", "not open");
        setText("[data-auction-epoch-label]", "Presale Pending");
        return;
      }

      endTime = startTime + BigInt(duration || 0);
      remaining = endTime > now ? endTime - now : 0n;

      setText("[data-auction-timeLeft]", formatDuration(remaining));
      setText("[data-auction-timeLeft-unit]", remaining > 0n ? "remaining" : "ended");

      if (soldOut) {
        setText("[data-auction-epoch-label]", "Presale Filled");
      } else if (isActive && remaining > 0n) {
        setText("[data-auction-epoch-label]", "Presale Active");
      } else if (remaining === 0n) {
        setText("[data-auction-epoch-label]", "Presale Ended");
      } else {
        setText("[data-auction-epoch-label]", "Presale Pending");
      }

      if ((remaining === 0n || soldOut) && auctionCountdownTimer) {
        window.clearInterval(auctionCountdownTimer);
        auctionCountdownTimer = null;
      }
    }

    if (auctionCountdownTimer) {
      window.clearInterval(auctionCountdownTimer);
    }

    tick();
    auctionCountdownTimer = window.setInterval(tick, 1000);
  }

  async function auctionPrice(chain) {
    return normalizeAssetItems(
      await publicClientForChain(chain).readContract({
        address: chain.auction.address,
        abi: AUCTION_ABI,
        functionName: "getPrice"
      })
    );
  }

  function paymentsForMintAmount(prices, mintAmount, mintDecimals) {
    var scale = 10n ** BigInt(mintDecimals);

    return prices.map(function (price) {
      var product = price.amount * mintAmount;
      var amount = product / scale;

      if (product % scale !== 0n) {
        amount += 1n;
      }

      return {
        address: price.address,
        amount: amount
      };
    });
  }

  function isNativeAssetAddress(address) {
    return String(address || "").toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
  }

  async function tokenAllowance(tokenAddress, owner, spender, chain) {
    return publicClientForChain(chain).readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner, spender]
    });
  }

  function buildApproveTokenTransaction(tokenAddress, spender, amount) {
    return {
      from: state.account,
      to: tokenAddress,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spender, amount]
      }),
      value: "0x0"
    };
  }

  async function ensureAuctionPaymentApprovals(chain, payments) {
    var vaultAddress = chain && chain.auction ? chain.auction.vaultAddress : "";
    var requiredPayments = payments.filter(function (payment) {
      return payment.amount > 0n && isAddress(payment.address) && !isNativeAssetAddress(payment.address);
    });

    if (!requiredPayments.length) return true;
    if (!isAddress(vaultAddress)) {
      setStatus("[data-page-status]", "Configure the vault address before enabling auction approvals.", "warn");
      return false;
    }

    for (var index = 0; index < requiredPayments.length; index += 1) {
      var payment = requiredPayments[index];
      var display = assetDisplay(chain, payment, 4);
      var allowance;
      var approvalTx;
      var receipt;
      var txHash;

      try {
        allowance = await tokenAllowance(payment.address, state.account, vaultAddress, chain);
      } catch (error) {
        setStatus("[data-page-status]", "Could not read " + display.unit + " allowance.", "warn");
        return false;
      }

      if (allowance >= payment.amount) continue;

      approvalTx = buildApproveTokenTransaction(payment.address, vaultAddress, payment.amount);

      setStatus("[data-page-status]", "Simulating " + display.unit + " approval...", "warn");
      try {
        await simulateTransaction(approvalTx, chain);
      } catch (error) {
        setStatus("[data-page-status]", display.unit + " approval preflight failed: " + simulationFailureMessage(error), "warn");
        return false;
      }

      setStatus("[data-page-status]", "Approving " + display.unit + " for vault transfer...", "warn");
      txHash = await sendTransaction(approvalTx);

      setStatus("[data-page-status]", "Waiting for " + display.unit + " approval...", "warn");
      receipt = await waitForTransaction(txHash);
      if (!receipt) {
        setStatus("[data-page-status]", display.unit + " approval is still pending. Try buying again after it confirms.", "warn");
        return false;
      }
      if (receipt.status === "0x0") {
        setStatus("[data-page-status]", display.unit + " approval reverted.", "warn");
        return false;
      }
    }

    return true;
  }

  function buildAuctionBuyData(epochId, deadline, mintAmount, maxPayments) {
    return encodeFunctionData({
      abi: AUCTION_ABI,
      functionName: "buy",
      args: [
        epochId,
        deadline,
        mintAmount,
        maxPayments.map(function (payment) {
          return [payment.address, payment.amount];
        })
      ]
    });
  }

  async function submitAuctionBuy() {
    var chain = currentChainConfig();
    var input = $("#bidAmount");
    var amount;
    var auctionTx;
    var deadline;
    var epochId;
    var prices;
    var maxPayments;
    var receipt;
    var txHash;

    if (!chain || !chain.auction || !isAddress(chain.auction.address)) {
      setStatus("[data-page-status]", "Configure the auction contract address before enabling buys.", "warn");
      return;
    }

    amount = parseUnits(input ? input.value : "", chain.auction.mintDecimals === undefined ? 18 : chain.auction.mintDecimals);
    updateAuctionPaymentPreview();

    if (amount <= 0n) {
      setStatus("[data-page-status]", "Enter a mint amount.", "warn");
      return;
    }

    if (auctionUiState.remainingLot !== null && amount > auctionUiState.remainingLot) {
      setStatus("[data-page-status]", "Amount exceeds the remaining lot. Use Max or enter a smaller amount.", "warn");
      return;
    }

    setStatus("[data-page-status]", "Reading auction epoch and price...", "warn");
    try {
      var auctionReads = await Promise.all([
        publicClientForChain(chain).readContract({
          address: chain.auction.address,
          abi: AUCTION_ABI,
          functionName: "epochId"
        }),
        auctionPrice(chain)
      ]);
      epochId = auctionReads[0];
      prices = auctionReads[1];
    } catch (error) {
      setStatus("[data-page-status]", "Could not read auction epoch or price.", "warn");
      return;
    }

    if (!prices.length) {
      setStatus("[data-page-status]", "Auction price returned no payment assets.", "warn");
      return;
    }

    maxPayments = paymentsForMintAmount(prices, amount, chain.auction.mintDecimals === undefined ? 18 : chain.auction.mintDecimals);
    deadline = BigInt(Math.floor(Date.now() / 1000) + (chain.auction.deadlineSeconds || 1200));

    if (!(await ensureAuctionPaymentApprovals(chain, maxPayments))) {
      return;
    }

    auctionTx = {
      from: state.account,
      to: chain.auction.address,
      data: buildAuctionBuyData(epochId, deadline, amount, maxPayments),
      value: "0x0"
    };

    setStatus("[data-page-status]", "Simulating auction buy...", "warn");
    try {
      await simulateTransaction(auctionTx, chain);
    } catch (error) {
      setStatus("[data-page-status]", "Auction preflight failed: " + simulationFailureMessage(error), "warn");
      return;
    }

    setStatus("[data-page-status]", "Submitting auction buy transaction...", "warn");
    txHash = await sendTransaction(auctionTx, chain);

    setStatus("[data-page-status]", "Buy submitted: " + txHash.slice(0, 10) + "... waiting for confirmation.", "ok");
    refreshAuctionDataSoon();

    receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", "Buy submitted and still pending. Auction data will refresh again after confirmation.", "warn");
      return;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", "Auction buy reverted.", "warn");
      loadAuctionData();
      return;
    }

    setStatus("[data-page-status]", "Buy confirmed: " + txHash.slice(0, 10) + "...", "ok");
    loadAuctionData();
  }

  async function readPresaleVaultAddress(chain) {
    var client = publicClientForChain(chain);
    var controller = await client.readContract({
      address: presaleAddress(chain),
      abi: PRESALE_AUCTION_ABI,
      functionName: "CONTROLLER"
    });

    if (!isAddress(controller)) return "";

    return client.readContract({
      address: controller,
      abi: CONTROLLER_VIEW_ABI,
      functionName: "VAULT"
    });
  }

  async function ensurePresalePaymentApproval(chain, paymentAmount) {
    var assetAddress = presaleUiState.assetAddress;
    var vaultAddress = presaleUiState.vaultAddress;
    var display;
    var allowance;
    var approvalTx;
    var receipt;
    var txHash;

    if (!isAddress(assetAddress)) {
      setStatus("[data-page-status]", "Presale payment asset is not available yet.", "warn");
      return false;
    }

    if (isNativeAssetAddress(assetAddress)) return true;

    if (!isAddress(vaultAddress)) {
      try {
        vaultAddress = await readPresaleVaultAddress(chain);
        presaleUiState.vaultAddress = isAddress(vaultAddress) ? vaultAddress : "";
      } catch (error) {
        vaultAddress = "";
      }
    }

    if (!isAddress(vaultAddress)) {
      setStatus("[data-page-status]", "Could not resolve the presale vault spender for approval.", "warn");
      return false;
    }

    display = assetDisplay(chain, { address: assetAddress, amount: paymentAmount }, 4);

    try {
      allowance = await tokenAllowance(assetAddress, state.account, vaultAddress, chain);
    } catch (error) {
      setStatus("[data-page-status]", "Could not read " + display.unit + " allowance.", "warn");
      return false;
    }

    if (allowance >= paymentAmount) return true;

    approvalTx = buildApproveTokenTransaction(assetAddress, vaultAddress, paymentAmount);

    setStatus("[data-page-status]", "Simulating " + display.unit + " approval...", "warn");
    try {
      await simulateTransaction(approvalTx, chain);
    } catch (error) {
      setStatus("[data-page-status]", display.unit + " approval preflight failed: " + simulationFailureMessage(error), "warn");
      return false;
    }

    setStatus("[data-page-status]", "Approving " + display.unit + " for presale payment...", "warn");
    txHash = await sendTransaction(approvalTx, chain);

    setStatus("[data-page-status]", "Waiting for " + display.unit + " approval...", "warn");
    receipt = await waitForTransaction(txHash, chain);
    console.log("[presale] approval receipt", { txHash: txHash, receipt: receipt });
    if (!receipt) {
      setStatus("[data-page-status]", display.unit + " approval is still pending. Try buying again after it confirms.", "warn");
      return false;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", display.unit + " approval reverted.", "warn");
      return false;
    }

    return true;
  }

  // Returns an {to,data,value} approve tx for the presale payment if allowance is
  // insufficient, else null. Used to batch approve+buy for MOSS (see submitPresaleBuy).
  async function presaleApproveTxIfNeeded(chain, paymentAmount) {
    var assetAddress = presaleUiState.assetAddress;
    if (!isAddress(assetAddress) || isNativeAssetAddress(assetAddress)) return null;

    var vaultAddress = presaleUiState.vaultAddress;
    if (!isAddress(vaultAddress)) {
      try {
        vaultAddress = await readPresaleVaultAddress(chain);
        presaleUiState.vaultAddress = isAddress(vaultAddress) ? vaultAddress : "";
      } catch (error) {
        vaultAddress = "";
      }
    }
    if (!isAddress(vaultAddress)) {
      throw new Error("Could not resolve the presale vault spender for approval.");
    }

    var allowance = await tokenAllowance(assetAddress, state.account, vaultAddress, chain);
    if (allowance >= paymentAmount) return null;
    return buildApproveTokenTransaction(assetAddress, vaultAddress, paymentAmount);
  }

  function buildPresaleBuyData(amount, maxPayment, deadline, useBuyMax) {
    return encodeFunctionData({
      abi: PRESALE_AUCTION_ABI,
      functionName: useBuyMax ? "buyMax" : "buy",
      args: useBuyMax ? [maxPayment, deadline] : [amount, maxPayment, deadline]
    });
  }

  async function submitPresaleBuy() {
    var chain = currentChainConfig();
    var input = $("#bidAmount");
    var amount;
    var bps;
    var deadline;
    var maxPayment;
    var presaleTx;
    var quote;
    var receipt;
    var txHash;
    var useBuyMax;

    if (!chain || !presaleAddress(chain)) {
      setStatus("[data-page-status]", "Configure the presale contract address before enabling bids.", "warn");
      return;
    }

    updatePresalePaymentPreview();
    deadline = BigInt(Math.floor(Date.now() / 1000) + presaleDeadlineSeconds(chain));

    if (presaleInputMode() === "mega") {
      // The user picks how much ASSET (MEGA) to spend; that's the hard payment cap.
      // Derive the ENTEN amount whose cost fits the budget and buy exactly that.
      maxPayment = parseUnits(input ? input.value : "", presaleAssetDecimals(chain));

      if (maxPayment <= 0n) {
        setStatus("[data-page-status]", "Enter an amount of " + presaleAssetSymbol(chain) + " to spend.", "warn");
        return;
      }

      amount = estimateEntenForSpend(maxPayment);

      if (amount === null || amount <= 0n) {
        setStatus("[data-page-status]", "That amount is too small to receive any ENTEN. Increase the spend.", "warn");
        return;
      }

      if (
        presaleUiState.minBid !== null &&
        amount < presaleUiState.minBid &&
        (presaleUiState.remainingLot === null || amount !== presaleUiState.remainingLot)
      ) {
        setStatus(
          "[data-page-status]",
          "That spend buys less than the minimum bid of " + formatUnitsCompact(presaleUiState.minBid, presaleMintDecimals(chain)) + " ENTEN. Increase the amount.",
          "warn"
        );
        return;
      }

      useBuyMax = presaleUiState.remainingLot !== null && amount === presaleUiState.remainingLot;
    } else {
      amount = parseUnits(input ? input.value : "", presaleMintDecimals(chain));

      if (amount <= 0n) {
        setStatus("[data-page-status]", "Enter a presale allocation amount.", "warn");
        return;
      }

      if (presaleUiState.remainingLot !== null && amount > presaleUiState.remainingLot) {
        setStatus("[data-page-status]", "Amount exceeds the remaining presale allocation. Use Max or enter a smaller amount.", "warn");
        return;
      }

      if (
        presaleUiState.minBid !== null &&
        amount < presaleUiState.minBid &&
        (presaleUiState.remainingLot === null || amount !== presaleUiState.remainingLot)
      ) {
        setStatus(
          "[data-page-status]",
          "Amount is below the presale minimum bid of " + formatUnitsCompact(presaleUiState.minBid, presaleMintDecimals(chain)) + ".",
          "warn"
        );
        return;
      }

      setStatus("[data-page-status]", "Reading presale quote...", "warn");
      try {
        quote = await readPresaleQuote(chain, amount);
      } catch (error) {
        setStatus("[data-page-status]", "Could not quote the presale amount: " + simulationFailureMessage(error), "warn");
        return;
      }

      if (quote.payment <= 0n) {
        setStatus("[data-page-status]", "Presale quote returned no payment amount.", "warn");
        return;
      }

      bps = presaleMaxPaymentBufferBps(chain);
      maxPayment = paymentAmountWithBuffer(quote.payment, bps);
      useBuyMax = presaleUiState.remainingLot !== null && amount === presaleUiState.remainingLot;
    }

    presaleTx = {
      from: state.account,
      to: presaleAddress(chain),
      data: buildPresaleBuyData(amount, maxPayment, deadline, useBuyMax),
      value: "0x0"
    };

    console.log("[presale] buy tx built", {
      to: presaleTx.to,
      useBuyMax: useBuyMax,
      amount: String(amount),
      maxPayment: String(maxPayment),
      deadline: String(deadline)
    });

    if (isMossWallet()) {
      // MOSS fails on two sequential callContract calls, so batch approve + buy
      // into ONE atomic call. The approve runs before the buy within the same tx,
      // so no separate wait/allowance round-trip is needed.
      var batch = [];
      try {
        var approveTx = await presaleApproveTxIfNeeded(chain, maxPayment);
        if (approveTx) batch.push(approveTx);
      } catch (error) {
        setStatus("[data-page-status]", error && error.message ? error.message : "Could not prepare the approval.", "warn");
        return;
      }
      batch.push(presaleTx);

      // Only the no-approve case can be preflight-simulated standalone (with an
      // approve in the batch the allowance isn't set yet); otherwise rely on the
      // atomic batch reverting as a whole if the buy would fail.
      if (batch.length === 1) {
        setStatus("[data-page-status]", "Simulating presale buy...", "warn");
        try {
          await simulateTransaction(presaleTx, chain);
        } catch (error) {
          console.error("[presale] buy preflight (simulation) reverted", error);
          setStatus("[data-page-status]", "Presale preflight failed: " + simulationFailureMessage(error), "warn");
          return;
        }
      }

      setStatus("[data-page-status]", batch.length > 1 ? "Submitting approve + buy..." : "Submitting presale buy...", "warn");
      try {
        txHash = await mossSendCalls(batch);
      } catch (error) {
        if (error && error.code === 4001) {
          setStatus("[data-page-status]", "Presale buy was rejected.", "warn");
        } else {
          setStatus("[data-page-status]", "Presale buy failed: " + (error && error.message ? error.message : "unknown error"), "warn");
        }
        return;
      }
    } else {
      // Injected wallets: sequential approve, then buy (works fine there).
      if (!(await ensurePresalePaymentApproval(chain, maxPayment))) {
        console.warn("[presale] aborted: payment approval did not complete");
        return;
      }

      setStatus("[data-page-status]", "Simulating presale buy...", "warn");
      try {
        await simulateTransaction(presaleTx, chain);
      } catch (error) {
        console.error("[presale] buy preflight (simulation) reverted", error);
        setStatus("[data-page-status]", "Presale preflight failed: " + simulationFailureMessage(error), "warn");
        return;
      }

      setStatus("[data-page-status]", "Submitting presale buy transaction...", "warn");
      txHash = await sendTransaction(presaleTx, chain);
    }

    setStatus("[data-page-status]", "Presale buy submitted: " + txHash.slice(0, 10) + "... waiting for confirmation.", "ok");
    refreshPresaleDataSoon();

    receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", "Buy submitted and still pending. Presale data will refresh again after confirmation.", "warn");
      return;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", "Presale buy reverted.", "warn");
      loadPresaleData();
      return;
    }

    setStatus("[data-page-status]", "Presale buy confirmed: " + txHash.slice(0, 10) + "...", "ok");
    loadPresaleData();
  }

  async function submitStartNextAuction() {
    var chain = currentChainConfig();
    var receipt;
    var startTx;
    var txHash;

    if (!chain || !chain.auction || !isAddress(chain.auction.address)) {
      setStatus("[data-page-status]", "Configure the auction contract address before starting the next auction.", "warn");
      return;
    }

    startTx = {
      from: state.account,
      to: chain.auction.address,
      data: encodeFunctionData({
        abi: AUCTION_ABI,
        functionName: "startNextAuction"
      }),
      value: "0x0"
    };

    setStatus("[data-page-status]", "Simulating next auction start...", "warn");
    try {
      await simulateTransaction(startTx, chain);
    } catch (error) {
      setStatus("[data-page-status]", "Start preflight failed: " + simulationFailureMessage(error), "warn");
      return;
    }

    setStatus("[data-page-status]", "Submitting next auction start...", "warn");
    txHash = await sendTransaction(startTx, chain);
    setStatus("[data-page-status]", "Start submitted: " + txHash.slice(0, 10) + "... waiting for confirmation.", "ok");
    refreshAuctionDataSoon();

    receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", "Start submitted and still pending. Auction data will refresh again after confirmation.", "warn");
      return;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", "Start next auction reverted.", "warn");
      loadAuctionData();
      return;
    }

    setStatus("[data-page-status]", "Next auction started: " + txHash.slice(0, 10) + "...", "ok");
    loadAuctionData();
  }

  function launchInputs() {
    return {
      name: $("[data-launch-name]"),
      symbol: $("[data-launch-symbol]"),
      maxSupply: $("[data-launch-max-supply]"),
      admin: $("[data-launch-admin]"),
      totalPremint: $("[data-launch-total-premint]"),
      nonTeam: $("[data-launch-non-team]"),
      team: $("[data-launch-team]")
    };
  }

  function normalizeDeploymentResult(deployment) {
    deployment = deployment || {};
    return {
      controller: deployment.controller || deployment[0] || "",
      kernel: deployment.kernel || deployment[1] || "",
      vault: deployment.vault || deployment[2] || "",
      token: deployment.token || deployment[3] || "",
      teamLocker: deployment.teamLocker || deployment[4] || ""
    };
  }

  function setAddressText(selector, address) {
    $all(selector).forEach(function (node) {
      node.textContent = isAddress(address) ? shortenAddress(address) : "--";
      if (isAddress(address)) {
        node.title = address;
      } else {
        node.removeAttribute("title");
      }
    });
  }

  function launchSalt() {
    if (!launchUiState.salt) {
      launchUiState.salt = randomBytes32();
    }
    return launchUiState.salt;
  }

  function syncLaunchAdminInput() {
    var inputs = launchInputs();

    if (!inputs.admin || !state.account) return;
    if (!inputs.admin.value || inputs.admin.value === launchUiState.adminAutofill) {
      inputs.admin.value = state.account;
      launchUiState.adminAutofill = state.account;
    }
  }

  function setLaunchInputValue(input, amount) {
    if (!input) return;
    input.value = formatTokenInputAmount(amount);
  }

  function setLaunchBar(selector, percent) {
    var bounded = Math.max(0, Math.min(100, Number(percent || 0)));
    $all(selector).forEach(function (node) {
      node.style.width = bounded + "%";
    });
  }

  function updateLaunchSummary(changedField) {
    var inputs = launchInputs();
    var maxSupply = parseTokenAmountInput(inputs.maxSupply ? inputs.maxSupply.value : "");
    var totalPremint = parseTokenAmountInput(inputs.totalPremint ? inputs.totalPremint.value : "");
    var nonTeam = parseTokenAmountInput(inputs.nonTeam ? inputs.nonTeam.value : "");
    var team = parseTokenAmountInput(inputs.team ? inputs.team.value : "");
    var nonTeamPercent = 0;
    var teamPercent = 0;

    if (changedField === "nonTeam" || changedField === "team") {
      totalPremint = nonTeam + team;
      setLaunchInputValue(inputs.totalPremint, totalPremint);
    } else if (totalPremint >= team) {
      nonTeam = totalPremint - team;
      setLaunchInputValue(inputs.nonTeam, nonTeam);
    }

    if (totalPremint > 0n) {
      nonTeamPercent = Number((nonTeam * 10000n) / totalPremint) / 100;
      teamPercent = Number((team * 10000n) / totalPremint) / 100;
    }

    setText("[data-launch-total-display]", maxSupply > 0n ? formatUnitsCompact(maxSupply, 18) : "--");
    setText("[data-launch-premint-ratio]", formatPercent(totalPremint, maxSupply));
    setText("[data-launch-non-team-ratio]", formatPercent(nonTeam, totalPremint));
    setText("[data-launch-team-ratio]", formatPercent(team, totalPremint));
    setText("[data-launch-non-team-label]", formatPercent(nonTeam, totalPremint));
    setText("[data-launch-team-label]", formatPercent(team, totalPremint));
    setLaunchBar("[data-launch-non-team-bar]", nonTeamPercent);
    setLaunchBar("[data-launch-team-bar]", teamPercent);
  }

  function launchConfigFromForm() {
    var inputs = launchInputs();
    var tokenName = inputs.name ? inputs.name.value.trim() : "";
    var tokenSymbol = inputs.symbol ? inputs.symbol.value.trim().toUpperCase() : "";
    var admin = inputs.admin ? inputs.admin.value.trim() : "";
    var maxSupply = parseTokenAmountInput(inputs.maxSupply ? inputs.maxSupply.value : "");
    var preMineAmount = parseTokenAmountInput(inputs.totalPremint ? inputs.totalPremint.value : "");
    var teamTokenAmount = parseTokenAmountInput(inputs.team ? inputs.team.value : "");

    return {
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      admin: admin,
      maxSupply: maxSupply,
      preMineAmount: preMineAmount,
      teamTokenAmount: teamTokenAmount,
      config: {
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        preMineAddress: admin,
        preMineAmount: preMineAmount,
        teamTokenAmount: teamTokenAmount,
        maxSupply: maxSupply
      }
    };
  }

  function launchValidationError(launch) {
    if (!launch.tokenName) return "Enter a token name.";
    if (!launch.tokenSymbol) return "Enter a token symbol.";
    if (!/^[A-Z0-9]{2,12}$/.test(launch.tokenSymbol)) return "Use a 2-12 character alphanumeric token symbol.";
    if (!isAddress(launch.admin)) return "Enter a valid admin address.";
    if (launch.maxSupply <= 0n) return "Enter a max supply greater than zero.";
    if (launch.preMineAmount > launch.maxSupply) return "Premint cannot exceed max supply.";
    if (launch.teamTokenAmount > launch.preMineAmount) return "Team allocation cannot exceed total premint.";
    return "";
  }

  async function loadLaunchFactoryData() {
    var chain = activeFactoryChainConfig();
    var factoryAddress = controllerFactoryAddress(chain);
    var total;

    setText("[data-launch-salt]", launchSalt().slice(0, 10) + "...");

    if (!chain || !factoryAddress) {
      setText("[data-launch-total-controllers]", "--");
      setText("[data-launch-factory-chain]", "Not configured");
      setText("[data-launch-factory-address]", "Not configured");
      return;
    }

    setText("[data-launch-factory-chain]", chain.shortName);
    setText("[data-launch-factory-address]", factoryAddress);

    try {
      total = await publicClientForChain(chain).readContract({
        address: factoryAddress,
        abi: CONTROLLER_FACTORY_ABI,
        functionName: "totalControllers"
      });
      setText("[data-launch-total-controllers]", total.toString());
    } catch (error) {
      setText("[data-launch-total-controllers]", "--");
    }
  }

  async function updateLaunchPrediction() {
    var chain = activeFactoryChainConfig();
    var factoryAddress = controllerFactoryAddress(chain);
    var deployment;

    if (!chain || !factoryAddress || !state.account) {
      setAddressText("[data-launch-predicted-controller]", "");
      setAddressText("[data-launch-predicted-token]", "");
      return;
    }

    try {
      deployment = normalizeDeploymentResult(
        await publicClientForChain(chain).readContract({
          address: factoryAddress,
          abi: CONTROLLER_FACTORY_ABI,
          functionName: "predictDeployment",
          args: [state.account, launchSalt()]
        })
      );
      setAddressText("[data-launch-predicted-controller]", deployment.controller);
      setAddressText("[data-launch-predicted-token]", deployment.token);
    } catch (error) {
      setAddressText("[data-launch-predicted-controller]", "");
      setAddressText("[data-launch-predicted-token]", "");
    }
  }

  function scheduleLaunchPrediction() {
    if (launchUiState.previewTimer) {
      window.clearTimeout(launchUiState.previewTimer);
    }
    launchUiState.previewTimer = window.setTimeout(updateLaunchPrediction, 350);
  }

  function updateLaunchUi() {
    if (!$("[data-launch-form]")) return;
    syncLaunchAdminInput();
    updateLaunchSummary();
    loadLaunchFactoryData();
    scheduleLaunchPrediction();
  }

  async function ensureFactoryNetwork(actionLabel) {
    var chain = currentChainConfig();
    var targetChain = activeFactoryChainConfig();

    if (controllerFactoryAddress(chain)) return true;

    if (!targetChain) {
      setStatus("[data-page-status]", "Controller factory is not configured on a supported network yet.", "warn");
      return false;
    }

    if (!state.provider) return false;

    setStatus("[data-page-status]", "Switching wallet to " + targetChain.shortName + " for " + actionLabel + ".", "warn");

    try {
      return await switchNetwork(targetChain.chainId);
    } catch (error) {
      setStatus("[data-page-status]", "Switch to " + targetChain.shortName + " before continuing.", "warn");
      return false;
    }
  }

  function buildLaunchControllerTransaction(chain, launch) {
    return {
      from: state.account,
      to: controllerFactoryAddress(chain),
      data: encodeFunctionData({
        abi: CONTROLLER_FACTORY_ABI,
        functionName: "launchController",
        args: [launch.admin, launchSalt(), launch.config]
      }),
      value: "0x0"
    };
  }

  async function submitLaunchToken() {
    var chain = currentChainConfig();
    var launch = launchConfigFromForm();
    var validation = launchValidationError(launch);
    var launchTx;
    var receipt;
    var txHash;

    updateLaunchSummary();

    if (validation) {
      setStatus("[data-page-status]", validation, "warn");
      return;
    }

    if (!chain || !controllerFactoryAddress(chain)) {
      setStatus("[data-page-status]", "Configure the ControllerFactory address before launching.", "warn");
      return;
    }

    launchTx = buildLaunchControllerTransaction(chain, launch);

    setStatus("[data-page-status]", "Simulating token launch...", "warn");
    try {
      await simulateTransaction(launchTx, chain);
    } catch (error) {
      setStatus("[data-page-status]", "Launch preflight failed: " + simulationFailureMessage(error), "warn");
      return;
    }

    setStatus("[data-page-status]", "Submitting token launch...", "warn");
    txHash = await sendTransaction(launchTx, chain);
    setStatus("[data-page-status]", "Launch submitted: " + txHash.slice(0, 10) + "... waiting for confirmation.", "ok");

    receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", "Launch submitted and still pending. Factory metrics will update after confirmation.", "warn");
      return;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", "Token launch reverted.", "warn");
      return;
    }

    setStatus("[data-page-status]", "Token launch confirmed: " + txHash.slice(0, 10) + "...", "ok");
    launchUiState.salt = randomBytes32();
    loadLaunchFactoryData();
    updateLaunchPrediction();
  }

  async function loadPresaleData() {
    var chain = activePresaleChainConfig();
    var address = presaleAddress(chain);
    var enten = chain && chain.tokens ? chain.tokens.enten : null;
    var backingAsset = presaleBackingAssetConfig(chain);
    var kernelAddress = presaleKernelAddress(chain);
    var client;
    var calls;
    var results = {};
    var now = BigInt(Math.floor(Date.now() / 1000));
    var soldOut = false;
    var fallbackActive = false;
    var assetUnit = "";
    var canSetStatus = shouldSetPassivePageStatus();

    if (!IS_PRESALE_PAGE) return;

    if (!chain || !address) {
      presaleUiState.remainingLot = null;
      presaleUiState.presaleSize = null;
      presaleUiState.sold = null;
      presaleUiState.totalCommitted = null;
      presaleUiState.minBid = null;
      presaleUiState.price = null;
      presaleUiState.minPrice = null;
      presaleUiState.backingPerToken = null;
      presaleUiState.assetAddress = "";
      presaleUiState.assetUsdPrice = null;
      presaleUiState.vaultAddress = "";
      presaleUiState.virtualReserve = null;
      presaleUiState.isActive = false;
      presaleUiState.chainId = "";
      setStartNextAuctionVisible(false);
      setText("[data-auction-epoch-label]", "Presale Unconfigured");
      setText("[data-auction-currentPrice]", "--");
      setText("[data-auction-currentPrice-unit]", "");
      setText("[data-presale-circulating]", "--");
      setText("[data-presale-fdv]", "--");
      setText("[data-auction-timeLeft]", "--:--:--");
      setText("[data-auction-timeLeft-unit]", "");
      setText("[data-auction-epochAllocation]", "--");
      setText("[data-auction-amountLeft]", "--");
      setText("[data-auction-tokensSold]", "--");
      updatePresaleMaxControl();
      updatePresalePaymentPreview();
      renderPresaleExtraMetrics(chain);
      if (canSetStatus) {
        setStatus("[data-page-status]", "Configure the presale contract address before enabling bids.", "warn");
      }
      return;
    }

    calls = [
      { key: "asset", address: address, abi: PRESALE_AUCTION_ABI, functionName: "ASSET" },
      { key: "controller", address: address, abi: PRESALE_AUCTION_ABI, functionName: "CONTROLLER" },
      { key: "price", address: address, abi: PRESALE_AUCTION_ABI, functionName: "price" },
      { key: "minimumPrice", address: address, abi: PRESALE_AUCTION_ABI, functionName: "minimumPrice" },
      { key: "presaleSize", address: address, abi: PRESALE_AUCTION_ABI, functionName: "PRESALE_SIZE" },
      { key: "remaining", address: address, abi: PRESALE_AUCTION_ABI, functionName: "remaining" },
      { key: "sold", address: address, abi: PRESALE_AUCTION_ABI, functionName: "sold" },
      { key: "totalCommitted", address: address, abi: PRESALE_AUCTION_ABI, functionName: "totalCommitted" },
      { key: "minBid", address: address, abi: PRESALE_AUCTION_ABI, functionName: "MIN_BID" },
      { key: "start", address: address, abi: PRESALE_AUCTION_ABI, functionName: "startTime" },
      { key: "duration", address: address, abi: PRESALE_AUCTION_ABI, functionName: "DURATION" },
      { key: "active", address: address, abi: PRESALE_AUCTION_ABI, functionName: "isActive" },
      { key: "virtualReserve", address: address, abi: PRESALE_AUCTION_ABI, functionName: "VIRTUAL_TOKEN_RESERVE" }
    ];

    if (
      enten &&
      isAddress(enten.address) &&
      backingAsset &&
      isAddress(backingAsset.address) &&
      isAddress(kernelAddress)
    ) {
      calls.push({ key: "totalSupply", address: enten.address, abi: ERC20_ABI, functionName: "totalSupply" });
      calls.push({
        key: "backingState",
        address: kernelAddress,
        abi: KERNEL_VIEW_ABI,
        functionName: "viewData",
        args: [backingStateSlots(backingAsset.address)]
      });
    }

    client = publicClientForChain(chain);

    try {
      var multicallResults = await client.multicall({
        allowFailure: true,
        contracts: calls.map(function (call) {
          return {
            address: call.address,
            abi: call.abi,
            functionName: call.functionName,
            args: call.args
          };
        })
      });
      multicallResults.forEach(function (result, index) {
        results[calls[index].key] = result && result.status === "success" ? result.result : null;
      });
    } catch (error) {
      await Promise.all(
        calls.map(async function (call) {
          try {
            results[call.key] = await client.readContract({
              address: call.address,
              abi: call.abi,
              functionName: call.functionName,
              args: call.args
            });
          } catch (innerError) {
            results[call.key] = null;
          }
        })
      );
    }

    // The controller's VAULT is immutable, so reuse the cached value across polling ticks and only
    // read it when we don't already have it for this presale/chain.
    if (isAddress(presaleUiState.vaultAddress) && presaleUiState.chainId === chain.chainId) {
      results.vault = presaleUiState.vaultAddress;
    } else if (isAddress(results.controller)) {
      try {
        results.vault = await client.readContract({
          address: results.controller,
          abi: CONTROLLER_VIEW_ABI,
          functionName: "VAULT"
        });
      } catch (error) {
        results.vault = null;
      }
    }

    presaleUiState.assetAddress = isAddress(results.asset) ? results.asset : "";
    presaleUiState.vaultAddress = isAddress(results.vault) ? results.vault : "";
    presaleUiState.presaleSize = results.presaleSize !== null && results.presaleSize !== undefined ? BigInt(results.presaleSize) : null;
    presaleUiState.remainingLot = results.remaining !== null && results.remaining !== undefined ? BigInt(results.remaining) : null;
    presaleUiState.sold = results.sold !== null && results.sold !== undefined ? BigInt(results.sold) : null;
    presaleUiState.totalCommitted = results.totalCommitted !== null && results.totalCommitted !== undefined ? BigInt(results.totalCommitted) : null;
    presaleUiState.minBid = results.minBid !== null && results.minBid !== undefined ? BigInt(results.minBid) : null;
    presaleUiState.price = results.price !== null && results.price !== undefined ? BigInt(results.price) : null;
    presaleUiState.minPrice = results.minimumPrice !== null && results.minimumPrice !== undefined ? BigInt(results.minimumPrice) : null;
    presaleUiState.backingPerToken =
      backingAsset &&
      isAddress(backingAsset.address) &&
      presaleUiState.assetAddress.toLowerCase() === backingAsset.address.toLowerCase()
        ? backingPerTokenFromState(results.backingState, results.totalSupply)
        : null;
    presaleUiState.virtualReserve = results.virtualReserve !== null && results.virtualReserve !== undefined ? BigInt(results.virtualReserve) : null;
    presaleUiState.mintDecimals = presaleMintDecimals(chain);
    presaleUiState.chainId = chain.chainId;

    soldOut = presaleUiState.remainingLot !== null && presaleUiState.remainingLot <= 0n;
    fallbackActive =
      results.start !== null &&
      results.start !== undefined &&
      BigInt(results.start) > 0n &&
      results.duration !== null &&
      results.duration !== undefined &&
      now < BigInt(results.start) + BigInt(results.duration) &&
      !soldOut;
    presaleUiState.isActive = results.active === null || results.active === undefined ? fallbackActive : Boolean(results.active);

    if (isAddress(presaleUiState.assetAddress)) {
      assetUnit = assetDisplay(chain, { address: presaleUiState.assetAddress, amount: 0n }, 4).unit;
    }

    if (presaleUiState.price !== null && isAddress(presaleUiState.assetAddress)) {
      setPresalePriceMetric(chain, presaleUiState.price, presaleUiState.assetAddress);
    } else {
      setText("[data-auction-currentPrice]", "--");
      setText("[data-auction-currentPrice-unit]", assetUnit);
    }

    try {
      presaleUiState.assetUsdPrice = await readAssetUsdPrice(chain, presaleUiState.assetAddress);
    } catch (error) {
      presaleUiState.assetUsdPrice = null;
    }
    renderPresaleValuation(chain);

    if (presaleUiState.presaleSize !== null) {
      setText("[data-auction-epochAllocation]", formatUnitsCompact(presaleUiState.presaleSize, presaleUiState.mintDecimals));
      setText("[data-auction-epochAllocation-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
    }

    if (presaleUiState.remainingLot !== null) {
      setText("[data-auction-amountLeft]", formatUnitsCompact(presaleUiState.remainingLot, presaleUiState.mintDecimals));
      setText("[data-auction-amountLeft-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
    }

    if (presaleUiState.sold !== null) {
      setText("[data-auction-tokensSold]", formatUnitsCompact(presaleUiState.sold, presaleUiState.mintDecimals));
      setText("[data-auction-tokensSold-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
    } else if (presaleUiState.presaleSize !== null && presaleUiState.remainingLot !== null) {
      setText(
        "[data-auction-tokensSold]",
        formatUnitsCompact(
          presaleUiState.presaleSize > presaleUiState.remainingLot ? presaleUiState.presaleSize - presaleUiState.remainingLot : 0n,
          presaleUiState.mintDecimals
        )
      );
      setText("[data-auction-tokensSold-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
    }

    if (results.start !== null && results.start !== undefined && results.duration !== null && results.duration !== undefined) {
      startPresaleCountdown(BigInt(results.start), BigInt(results.duration), soldOut, presaleUiState.isActive);
    } else {
      setStartNextAuctionVisible(false);
    }

    if (!canSetStatus) {
      /* Preserve wallet and transaction progress messages during background refreshes. */
    } else if (!presaleUiState.assetAddress) {
      setStatus("[data-page-status]", "Presale contract read succeeded, but ASSET() was unavailable.", "warn");
    } else if (results.start !== null && results.start !== undefined && BigInt(results.start) === 0n) {
      setStatus("[data-page-status]", "Presale contract configured. Waiting for admin open().", "warn");
    } else if (soldOut) {
      setStatus("[data-page-status]", "Presale allocation is fully subscribed.", "ok");
    } else if (!presaleUiState.isActive) {
      setStatus("[data-page-status]", "Presale window is not active.", "warn");
    } else {
      setStatus("[data-page-status]", "Live presale data loaded from " + chain.shortName + ".", "ok");
    }

    updatePresaleMaxControl();
    updatePresalePaymentPreview();
    renderPresaleExtraMetrics(chain);
  }

  async function loadAuctionData() {
    var chain = activeAuctionChainConfig();
    var auction = chain ? chain.auction : null;
    var client;
    var calls;
    var results = {};
    var endTime;
    var soldOut = false;

    if (!chain || !auction || !isAddress(auction.address)) {
      auctionUiState.remainingLot = null;
      auctionUiState.prices = [];
      auctionUiState.chainId = "";
      setStartNextAuctionVisible(false);
      updateAuctionMaxControl();
      updateAuctionPaymentPreview();
      return;
    }

    calls = [
      { key: "price", address: auction.address, abi: AUCTION_ABI, functionName: "getPrice", normalize: normalizeAssetItems },
      { key: "epochId", address: auction.address, abi: AUCTION_ABI, functionName: "epochId" },
      { key: "remaining", address: auction.address, abi: AUCTION_ABI, functionName: "remainingLot" },
      { key: "lotSize", address: auction.address, abi: AUCTION_ABI, functionName: "LOT_SIZE" },
      { key: "start", address: auction.address, abi: AUCTION_ABI, functionName: "startTime" },
      { key: "period", address: auction.address, abi: AUCTION_ABI, functionName: "epochPeriod" }
    ];

    if (isAddress(auction.vaultAddress)) {
      calls.push({ key: "backing", address: auction.vaultAddress, abi: VAULT_ABI, functionName: "backingBalances", normalize: normalizeAssetItems });
    }

    client = publicClientForChain(chain);

    try {
      var multicallResults = await client.multicall({
        allowFailure: true,
        contracts: calls.map(function (call) {
          return {
            address: call.address,
            abi: call.abi,
            functionName: call.functionName
          };
        })
      });
      multicallResults.forEach(function (result, index) {
        if (result && result.status === "success") {
          results[calls[index].key] = calls[index].normalize ? calls[index].normalize(result.result) : result.result;
        } else {
          results[calls[index].key] = null;
        }
      });
    } catch (error) {
      await Promise.all(
        calls.map(async function (call) {
          try {
            var value = await client.readContract({
              address: call.address,
              abi: call.abi,
              functionName: call.functionName
            });
            results[call.key] = call.normalize ? call.normalize(value) : value;
          } catch (innerError) {
            results[call.key] = null;
          }
        })
      );
    }

    auctionUiState.prices = results.price || [];
    auctionUiState.mintDecimals = auction.mintDecimals === undefined ? 18 : auction.mintDecimals;
    auctionUiState.chainId = chain.chainId;

    setAssetMetric("[data-auction-currentPrice]", "[data-auction-currentPrice-unit]", chain, results.price, "--", "");

    if (results.epochId !== null && results.epochId !== undefined) {
      setText("[data-auction-epoch-label]", "Epoch " + results.epochId.toString().padStart(3, "0") + " Active");
    }

    if (results.remaining !== null && results.remaining !== undefined) {
      auctionUiState.remainingLot = results.remaining;
      soldOut = results.remaining <= 0n;
      setText("[data-auction-amountLeft]", formatUnitsCompact(results.remaining, auction.mintDecimals === undefined ? 18 : auction.mintDecimals));
      setText("[data-auction-amountLeft-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
    } else {
      auctionUiState.remainingLot = null;
    }

    if (results.lotSize !== null && results.lotSize !== undefined) {
      if (results.remaining !== null && results.remaining !== undefined) {
        var tokensSold = results.lotSize > results.remaining ? results.lotSize - results.remaining : 0n;
        setText("[data-auction-tokensSold]", formatUnitsCompact(tokensSold, auction.mintDecimals === undefined ? 18 : auction.mintDecimals));
        setText("[data-auction-tokensSold-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
      }
      setText("[data-auction-epochAllocation]", formatUnitsCompact(results.lotSize, auction.mintDecimals === undefined ? 18 : auction.mintDecimals));
      setText("[data-auction-epochAllocation-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
    }

    if (results.start !== null && results.start !== undefined && results.period !== null && results.period !== undefined) {
      endTime = results.start + results.period;
      startAuctionCountdown(endTime, soldOut);
    } else {
      setStartNextAuctionVisible(soldOut);
    }

    if (results.backing) {
      setAssetMetric("[data-auction-totalBacking]", "[data-auction-totalBacking-unit]", chain, results.backing, "--", "");
    }

    updateAuctionMaxControl();
    updateAuctionPaymentPreview();
  }

  function updateNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    $all("[data-nav]").forEach(function (link) {
      var href = link.getAttribute("href");
      var target = href === "./" ? "index.html" : href.replace("./", "");
      if (target === path) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateWalletUi() {
    var provider = state.provider || getProvider();
    var accountLabel = shortenAddress(state.account);
    var chain = supportedChain(state.chainId);
    var networkTone = chain ? "ok" : state.chainId ? "warn" : "idle";

    state.provider = provider;
    setText("[data-account-label]", accountLabel);
    setText("[data-wallet-address]", accountLabel);

    if (state.account) {
      setPill("[data-wallet-status]", accountLabel, "ok");
      $all("[data-connect-wallet]").forEach(function (button) {
        button.disabled = false;
        button.textContent = accountLabel;
      });
    } else if (provider) {
      setPill("[data-wallet-status]", "Wallet ready", "warn");
      $all("[data-connect-wallet]").forEach(function (button) {
        button.disabled = false;
        button.textContent = "Connect Wallet";
      });
    } else {
      setPill("[data-wallet-status]", "No wallet", "warn");
      $all("[data-connect-wallet]").forEach(function (button) {
        button.disabled = false;
        button.textContent = "Install Wallet";
      });
    }

    setPill("[data-network-status]", currentChainName(), networkTone);
    setText("[data-connected-chain]", currentChainName());
    setDot("[data-network-dot]", networkTone);
    updateWalletDebug();
    updateContractLabels();
    if (IS_SWAP_PAGE) renderSwapControls();
    if (IS_LAUNCH_PAGE) updateLaunchUi();
    if (IS_WALLET_PAGE) renderWalletControls();
    if (IS_WALLET_PAGE) {
      loadMossBalances();
    } else if (IS_PRESALE_PAGE) {
      loadPresaleData();
    } else if (IS_AUCTION_PAGE) {
      loadAuctionData();
    } else if (IS_BORROW_PAGE) {
      loadBorrowData();
    }
    if (IS_SWAP_PAGE && state.account) {
      loadSwapBalances();
    }
  }

  async function getProviderState() {
    if (isMossWallet()) {
      state.provider = state.provider || makeMossProvider();
      state.chainId = mossChainIdForNetwork(mossState.network || mossNetworkForChainId(preferredChainId()));
      state.account = mossState.address || "";
      updateWalletUi();
      return;
    }

    state.provider = getProvider() || (await discoverProvider(250));
    bindProviderEvents(state.provider);

    if (!state.provider) {
      state.account = "";
      state.chainId = "";
      updateWalletUi();
      return;
    }

    try {
      var accounts = await request("eth_accounts");
      var chainId = await request("eth_chainId");
      state.account = accounts && accounts.length ? accounts[0] : "";
      state.chainId = chainId ? chainId.toLowerCase() : "";
    } catch (error) {
      state.account = "";
      state.chainId = "";
    }

    updateWalletUi();
  }

  async function switchNetwork(chainId) {
    var chain = supportedChain(chainId);
    if (!chain || !state.provider) return false;

    try {
      await request("wallet_switchEthereumChain", [{ chainId: chain.chainId }]);
    } catch (switchError) {
      if (!switchError || switchError.code !== 4902) {
        throw switchError;
      }

      var addChainParams = {
        chainId: chain.chainId,
        chainName: chain.chainName,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls
      };

      if (chain.blockExplorerUrls) {
        addChainParams.blockExplorerUrls = chain.blockExplorerUrls;
      }

      await request("wallet_addEthereumChain", [addChainParams]);
    }

    state.chainId = chain.chainId;
    try {
      window.localStorage.setItem(PREFERRED_CHAIN_KEY, chain.chainId);
    } catch (error) {
      /* localStorage can be unavailable for some embedded contexts. */
    }
    await getProviderState();
    return supportedChain(state.chainId) !== null;
  }

  async function ensureSupportedNetwork(actionLabel) {
    if (!state.provider) return false;
    if (supportedChain(state.chainId)) return true;

    setStatus(
      "[data-page-status]",
      "Switching wallet to " + SUPPORTED_CHAINS[preferredChainId()].shortName + " for " + actionLabel + ".",
      "warn"
    );

    try {
      return await switchNetwork(preferredChainId());
    } catch (error) {
      setStatus("[data-page-status]", "Switch to " + supportedChainNames() + " before continuing.", "warn");
      return false;
    }
  }

  async function ensureAuctionNetwork(actionLabel) {
    var chain = currentChainConfig();
    var targetChain = activeAuctionChainConfig();

    if (chain && chain.auction && isAddress(chain.auction.address)) return true;

    if (!targetChain) {
      setStatus("[data-page-status]", "Auction is not configured on a supported network yet.", "warn");
      return false;
    }

    if (!state.provider) return false;

    setStatus("[data-page-status]", "Switching wallet to " + targetChain.shortName + " for " + actionLabel + ".", "warn");

    try {
      return await switchNetwork(targetChain.chainId);
    } catch (error) {
      setStatus("[data-page-status]", "Switch to " + targetChain.shortName + " before continuing.", "warn");
      return false;
    }
  }

  async function ensurePresaleNetwork(actionLabel) {
    var chain = currentChainConfig();
    var targetChain = activePresaleChainConfig();

    if (presaleAddress(chain)) return true;

    if (!targetChain) {
      setStatus("[data-page-status]", "Presale is not configured on a supported network yet.", "warn");
      return false;
    }

    if (!state.provider) return false;

    setStatus("[data-page-status]", "Switching wallet to " + targetChain.shortName + " for " + actionLabel + ".", "warn");

    try {
      return await switchNetwork(targetChain.chainId);
    } catch (error) {
      setStatus("[data-page-status]", "Switch to " + targetChain.shortName + " before continuing.", "warn");
      return false;
    }
  }

  async function connectWallet() {
    var injectedEntries = await discoverProviderEntries(500);
    var entries = [{ kind: "moss", name: "MOSS Embedded Wallet", meta: "MegaETH · email / passkey · no extension" }].concat(
      injectedEntries.map(function (entry) {
        return { kind: "injected", entry: entry };
      })
    );

    var selected = await openWalletSelector(entries);

    if (!selected) {
      setStatus("[data-page-status]", "Wallet selection was cancelled.", "warn");
      updateWalletUi();
      return false;
    }

    if (selected.kind === "moss") {
      try {
        state.walletKind = "moss";
        state.provider = makeMossProvider();
        setStatus("[data-page-status]", "Opening the MOSS wallet…", "warn");
        await connectMoss();
        updateWalletUi();
        setStatus("[data-page-status]", "MOSS wallet connected on " + currentChainName() + ".", "ok");
        grantMossPagePermissions().catch(function () {});
        return true;
      } catch (error) {
        if (error && error.code === 4001) {
          setStatus("[data-page-status]", "Wallet connection was rejected.", "warn");
        } else {
          setStatus(
            "[data-page-status]",
            "MOSS wallet connection failed" + (error && error.message ? ": " + error.message : "."),
            "warn"
          );
        }
        updateWalletUi();
        return false;
      }
    }

    var selectedEntry = selected.entry;
    state.walletKind = "injected";
    state.provider = selectedEntry.provider;
    lastProviderSource = selectedEntry.source || "injected";
    bindProviderEvents(state.provider);
    persistWalletKind("injected");

    if (!state.provider) {
      setStatus("[data-page-status]", "No injected wallet found. Open this page over localhost and allow your wallet extension on this site.", "warn");
      updateWalletUi();
      return false;
    }

    try {
      var accounts = await request("eth_requestAccounts");
      var chainId = await request("eth_chainId");
      state.account = accounts && accounts.length ? accounts[0] : "";
      state.chainId = chainId ? chainId.toLowerCase() : "";
      updateWalletUi();

      if (!state.account) {
        setStatus("[data-page-status]", "No wallet account was returned.", "warn");
        return false;
      }

      if (!(await ensureSupportedNetwork("this app"))) {
        return false;
      }

      setStatus("[data-page-status]", "Wallet connected on " + currentChainName() + ".", "ok");
      return true;
    } catch (error) {
      if (error && error.code === 4001) {
        setStatus("[data-page-status]", "Wallet connection was rejected.", "warn");
      } else {
        setStatus("[data-page-status]", "Wallet connection failed. Check your wallet and try again.", "warn");
      }
      updateWalletUi();
      return false;
    }
  }

  function bindProviderEvents(provider) {
    if (!provider || typeof provider.on !== "function" || boundProvider === provider) return;
    boundProvider = provider;

    provider.on("accountsChanged", function (accounts) {
      state.account = accounts && accounts.length ? accounts[0] : "";
      updateWalletUi();
      if (state.account) {
        setStatus("[data-page-status]", "Wallet account changed.", "ok");
      } else {
        setStatus("[data-page-status]", "Wallet disconnected.", "warn");
      }
    });

    provider.on("chainChanged", function (chainId) {
      state.chainId = chainId ? chainId.toLowerCase() : "";
      if (supportedChain(state.chainId)) {
        try {
          window.localStorage.setItem(PREFERRED_CHAIN_KEY, state.chainId);
        } catch (error) {
          /* localStorage can be unavailable for some embedded contexts. */
        }
      }
      updateWalletUi();
      setStatus("[data-page-status]", "Network changed to " + currentChainName() + ".", supportedChain(state.chainId) ? "ok" : "warn");
    });
  }

  function bindWalletControls() {
    $all("[data-connect-wallet]").forEach(function (button) {
      button.addEventListener("click", connectWallet);
    });
  }

  // On boot, restore only the wallet kind the user previously selected. Existing
  // MOSS sessions initialise once near app boot so their connected state is
  // reflected without prompting. New and injected-wallet users do not download
  // the MOSS chunk or create its iframe until they deliberately select MOSS.
  function restoreWalletSession() {
    var stored = storedWalletKind();

    if (stored === "injected" && getProvider()) {
      state.walletKind = "injected";
      getProviderState();
      return;
    }

    var network = mossNetworkForChainId(preferredChainId());
    state.walletKind = "moss";
    state.provider = makeMossProvider();
    state.chainId = mossChainIdForNetwork(network);
    mossState.network = network;
    updateWalletUi();

    if (stored !== "moss") return;

    // Initialise once at app boot for an existing MOSS selection. This creates
    // the hidden hosted iframe and Penpal bridge without prompting. connect() is
    // still called only from a deliberate wallet-selection click.
    ensureMossInitialised(network)
      .then(function (status) {
        if (stored === "moss" && status && status.status === "connected" && status.address) {
          mossState.address = status.address;
          state.account = status.address;
          state.chainId = mossChainIdForNetwork(mossState.network);
          updateWalletUi();
        }
      })
      .catch(function (error) {
        console.warn("[MOSS] wallet bridge did not initialise", error);
      });
  }

  function bindAuctionPage() {
    var form = $("[data-auction-form]");
    var amountInput = $("#bidAmount");
    var maxButton = $("[data-auction-max-amount]");
    var buyMaxButton = $("[data-auction-buy-max]");
    var startNextButton = $("[data-auction-start-next]");
    if (IS_PRESALE_PAGE) return;
    if (!form) return;

    updateContractLabels();
    loadAuctionData();
    startAuctionAutoRefresh();

    if (amountInput) {
      amountInput.addEventListener("input", updateAuctionPaymentPreview);
    }

    if (maxButton) {
      maxButton.addEventListener("click", function () {
        if (!setAuctionAmountToMax()) return;
        if (amountInput) amountInput.focus();
      });
    }

    if (buyMaxButton) {
      buyMaxButton.addEventListener("click", async function () {
        if (!setAuctionAmountToMax()) {
          setStatus("[data-page-status]", "No remaining lot is available to acquire.", "warn");
          return;
        }

        if (!state.account && !(await connectWallet())) return;
        if (!(await ensureAuctionNetwork("buying the remaining lot"))) return;

        buyMaxButton.disabled = true;
        try {
          await submitAuctionBuy();
        } catch (error) {
          setStatus("[data-page-status]", "Max auction purchase failed or was rejected.", "warn");
        } finally {
          updateAuctionMaxControl();
        }
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!state.account && !(await connectWallet())) return;
      if (!(await ensureAuctionNetwork("buying"))) return;

      try {
        await submitAuctionBuy();
      } catch (error) {
        setStatus("[data-page-status]", "Auction transaction failed or was rejected.", "warn");
      }
    });

    if (startNextButton) {
      startNextButton.addEventListener("click", async function () {
        if (!state.account && !(await connectWallet())) return;
        if (!(await ensureAuctionNetwork("starting the next auction"))) return;

        startNextButton.disabled = true;
        try {
          await submitStartNextAuction();
        } catch (error) {
          setStatus("[data-page-status]", "Next auction start failed or was rejected.", "warn");
        } finally {
          startNextButton.disabled = false;
        }
      });
    }
  }

  function bindPresalePage() {
    var form = $("[data-auction-form]");
    var amountInput = $("#bidAmount");
    var maxButton = $("[data-auction-max-amount]");
    if (!IS_PRESALE_PAGE || !form) return;

    updateContractLabels();
    loadPresaleData();
    startPresaleAutoRefresh();

    if (amountInput) {
      amountInput.addEventListener("input", updatePresalePaymentPreview);
    }

    if (maxButton) {
      maxButton.addEventListener("click", async function () {
        if (!(await setPresaleAmountToMax())) return;
        if (amountInput) amountInput.focus();
      });
    }

    $all("[data-presale-mode]").forEach(function (modeBtn) {
      modeBtn.addEventListener("click", function () {
        setPresaleInputMode(modeBtn.getAttribute("data-presale-mode"));
        if (amountInput) amountInput.focus();
      });
    });

    // Apply the default denomination (sets labels/units/placeholder).
    setPresaleInputMode(presaleUiState.inputMode);

    setStartNextAuctionVisible(false);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!state.account && !(await connectWallet())) return;
      if (!(await ensurePresaleNetwork("buying the presale"))) return;

      try {
        await submitPresaleBuy();
      } catch (error) {
        setStatus("[data-page-status]", "Presale transaction failed or was rejected.", "warn");
      }
    });
  }

  function bindSwapPage() {
    var form = $("[data-swap-form]");
    var flip = $("[data-flip-swap]");
    var payAsset = $("[data-pay-asset]");
    var receiveAsset = $("[data-receive-asset]");
    var payInput = $("[data-pay-input]");
    var receiveInput = $("[data-receive-input]");
    if (!form) return;

    updateContractLabels();
    renderSwapControls();
    loadSwapMarketPrices();

    function onAssetChange(event) {
      var value = event.detail && event.detail.value ? event.detail.value : event.currentTarget.dataset.value;
      if (value && value !== "ENTEN") {
        swapUiState.quoteId = value;
      }
      renderSwapControls();
      scheduleSwapQuote();
      window.setTimeout(loadSwapBalances, 0);
    }

    if (payAsset) {
      payAsset.addEventListener("click", function () {
        toggleAssetMenu(payAsset);
      });
      payAsset.addEventListener("assetchange", onAssetChange);
    }
    if (receiveAsset) {
      receiveAsset.addEventListener("click", function () {
        toggleAssetMenu(receiveAsset);
      });
      receiveAsset.addEventListener("assetchange", onAssetChange);
    }

    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-asset-picker]")) {
        closeAssetMenus();
      }
    });

    if (payInput) {
      payInput.addEventListener("input", scheduleSwapQuote);
    }

    $all("[data-slippage]").forEach(function (choice) {
      choice.addEventListener("click", function () {
        var bps = Math.round(parseFloat(choice.getAttribute("data-slippage")) * 100);
        if (!isFinite(bps) || bps <= 0) return;
        swapUiState.slippageBps = bps;
        $all("[data-slippage]").forEach(function (other) {
          other.classList.toggle("active", other === choice);
        });
      });
    });

    if (flip) {
      flip.addEventListener("click", function () {
        swapUiState.reversed = !swapUiState.reversed;
        if (payInput) {
          payInput.value = "";
        }
        if (receiveInput) {
          receiveInput.value = "";
        }
        renderSwapControls();
        clearSwapQuote();
        window.setTimeout(loadSwapBalances, 0);
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!SWAP_TRADING_ENABLED) {
        setStatus("[data-page-status]", SWAP_UNAVAILABLE_MESSAGE, "warn");
        return;
      }

      if (!state.account && !(await connectWallet())) return;
      if (!(await ensureSupportedNetwork("swapping"))) return;

      try {
        await submitKumbayaSwap();
      } catch (error) {
        if (error && error.code === 4001) {
          setStatus("[data-page-status]", "Swap was rejected in the wallet.", "warn");
        } else {
          setStatus("[data-page-status]", "Swap transaction failed: " + (error && error.message ? error.message : "unknown error"), "warn");
        }
      }
    });
  }

  function bindLaunchPage() {
    var form = $("[data-launch-form]");
    var inputs = launchInputs();
    var submit = $("[data-launch-submit]");
    if (!form) return;

    launchSalt();
    updateLaunchUi();

    [
      { node: inputs.maxSupply, field: "maxSupply" },
      { node: inputs.totalPremint, field: "totalPremint" },
      { node: inputs.nonTeam, field: "nonTeam" },
      { node: inputs.team, field: "team" }
    ].forEach(function (entry) {
      if (!entry.node) return;
      entry.node.addEventListener("input", function () {
        updateLaunchSummary(entry.field);
      });
    });

    [inputs.name, inputs.symbol, inputs.admin].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", function () {
        if (input === inputs.symbol) {
          input.value = input.value.toUpperCase();
        }
        scheduleLaunchPrediction();
      });
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!state.account && !(await connectWallet())) return;
      if (!(await ensureFactoryNetwork("launching a token"))) return;

      if (submit) submit.disabled = true;
      try {
        await submitLaunchToken();
      } catch (error) {
        setStatus("[data-page-status]", "Token launch failed or was rejected.", "warn");
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  // ---- MOSS wallet page (wallet.html) -------------------------------------
  // Surfaces the MOSS SDK's own native flows (send/swap/deposit/open + balances)
  // for a MOSS-connected user. This does NOT touch the app's native swap/auction/
  // presale flows — those stay on the contract-call path. Injected wallets don't
  // expose these MOSS-hosted UIs, so the actions prompt the user to connect MOSS.

  // Ensures the user is connected through the MOSS embedded wallet before running
  // a MOSS-native action. Opens the wallet selector when needed and re-checks.
  async function ensureMossForAction(label) {
    if (!(isMossWallet() && state.account)) {
      if (!(await connectWallet())) return false;
    }
    if (!isMossWallet()) {
      setStatus("[data-page-status]", "Connect the MOSS embedded wallet to " + label + ".", "warn");
      return false;
    }
    return true;
  }

  // Runs a MOSS SDK action and reports its TransactionResult. deposit()/open()
  // resolve to undefined (no result object) — treated as a successful trigger.
  async function runMossWalletAction(label, action) {
    if (!(await ensureMossForAction(label))) return;

    setStatus("[data-page-status]", "Opening MOSS " + label + "…", "warn");
    var result;
    try {
      result = await action();
    } catch (error) {
      setStatus("[data-page-status]", "MOSS " + label + " failed: " + (error && error.message ? error.message : String(error)), "warn");
      return;
    }

    if (result && result.status === "cancelled") {
      setStatus("[data-page-status]", capitalize(label) + " was cancelled.", "warn");
      return;
    }
    if (result && result.status === "error") {
      setStatus("[data-page-status]", "MOSS " + label + " failed: " + (result.error || "unknown error"), "warn");
      return;
    }

    setStatus("[data-page-status]", capitalize(label) + " complete.", "ok");
    loadMossBalances();
  }

  function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  // Reflects connection state on the wallet page: address, action availability.
  function renderWalletControls() {
    if (!IS_WALLET_PAGE) return;

    var connectedToMoss = isMossWallet() && Boolean(state.account);
    setText("[data-wallet-address]", state.account ? shortenAddress(state.account) : "Not connected");

    $all("[data-wallet-send], [data-wallet-swap], [data-wallet-deposit], [data-wallet-open]").forEach(function (button) {
      // open() can run for any MOSS session; send/swap/deposit need an account too.
      button.disabled = !isMossWallet();
    });

    var refresh = $("[data-wallet-refresh-balances]");
    if (refresh) refresh.disabled = !connectedToMoss;
  }

  // Loads the MOSS wallet's owned-token balances and renders them.
  async function loadMossBalances() {
    if (!IS_WALLET_PAGE) return;
    var container = $("[data-wallet-balances]");
    if (!container) return;

    if (!(isMossWallet() && state.account)) {
      renderWalletBalancesMessage(container, "Connect a MOSS wallet to view balances.");
      return;
    }

    renderWalletBalancesMessage(container, "Loading balances…");

    var tokens;
    try {
      var mega = await loadMossSdk();
      tokens = await mega.balances({});
    } catch (error) {
      console.warn("[MOSS] balances failed", error);
      renderWalletBalancesMessage(container, "Could not load balances.");
      return;
    }

    if (!tokens || !tokens.length) {
      renderWalletBalancesMessage(container, "No tokens found in this wallet.");
      return;
    }

    container.textContent = "";
    tokens.forEach(function (token) {
      container.appendChild(buildBalanceRow(token));
    });
  }

  function renderWalletBalancesMessage(container, message) {
    container.textContent = "";
    var empty = document.createElement("div");
    empty.className = "wallet-balances-empty";
    empty.textContent = message;
    container.appendChild(empty);
  }

  // Builds one balance row via DOM nodes (token metadata is third-party, so avoid
  // innerHTML) — symbol/name on the left, formatted balance + USD on the right.
  function buildBalanceRow(token) {
    var row = document.createElement("div");
    row.className = "wallet-balance-row";

    var left = document.createElement("div");
    left.className = "wallet-balance-token";

    if (token.image) {
      var icon = document.createElement("img");
      icon.className = "wallet-balance-icon";
      icon.src = token.image;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      left.appendChild(icon);
    }

    var labels = document.createElement("div");
    var symbol = document.createElement("div");
    symbol.className = "wallet-balance-symbol";
    symbol.textContent = token.symbol || shortenAddress(token.address);
    var name = document.createElement("div");
    name.className = "wallet-balance-name";
    name.textContent = token.name || "";
    labels.appendChild(symbol);
    if (token.name) labels.appendChild(name);
    left.appendChild(labels);

    var right = document.createElement("div");
    right.className = "wallet-balance-amounts";
    var amount = document.createElement("div");
    amount.className = "wallet-balance-amount";
    amount.textContent = walletBalanceDisplay(token);
    right.appendChild(amount);
    if (token.usdBalance) {
      var usd = document.createElement("div");
      usd.className = "wallet-balance-usd";
      usd.textContent = "$" + token.usdBalance;
      right.appendChild(usd);
    }

    row.appendChild(left);
    row.appendChild(right);
    return row;
  }

  function walletBalanceDisplay(token) {
    if (token.displayBalance) return token.displayBalance;
    if (token.balance !== undefined && token.decimals !== undefined) {
      try {
        return formatUnits(BigInt(token.balance), token.decimals, 6);
      } catch (error) {
        return String(token.balance);
      }
    }
    return token.balance === undefined ? "--" : String(token.balance);
  }

  function bindWalletPage() {
    if (!IS_WALLET_PAGE) return;

    var send = $("[data-wallet-send]");
    if (send) {
      send.addEventListener("click", function () {
        runMossWalletAction("send", function () {
          return withMossSdk(function (mega) { return mega.send({}); });
        });
      });
    }

    var swap = $("[data-wallet-swap]");
    if (swap) {
      swap.addEventListener("click", function () {
        runMossWalletAction("swap", function () {
          return withMossSdk(function (mega) { return mega.swap({}); });
        });
      });
    }

    var deposit = $("[data-wallet-deposit]");
    if (deposit) {
      deposit.addEventListener("click", function () {
        runMossWalletAction("deposit", function () {
          return withMossSdk(function (mega) { return mega.deposit(); });
        });
      });
    }

    var open = $("[data-wallet-open]");
    if (open) {
      open.addEventListener("click", function () {
        runMossWalletAction("open wallet", function () {
          return withMossSdk(function (mega) { return mega.open(); });
        });
      });
    }

    var refresh = $("[data-wallet-refresh-balances]");
    if (refresh) {
      refresh.addEventListener("click", function () {
        loadMossBalances();
      });
    }

    renderWalletControls();
    loadMossBalances();
  }

  // userPosition().debt is a {asset, amount} tuple list; normalise to {address, amount}.
  function normalizeBorrowDebt(items) {
    return (items || [])
      .map(function (item) {
        var address = item && (item.asset || item.address || item[0]);
        var amount = item && (item.amount !== undefined ? item.amount : item[1]);

        if (!isAddress(address)) return null;
        return { address: address, amount: BigInt(amount || 0) };
      })
      .filter(Boolean);
  }

  function kernelAssetSlot(namespace, asset) {
    return keccak256(
      encodeAbiParameters(
        [{ type: "bytes32" }, { type: "address" }],
        [namespace, asset]
      )
    );
  }

  function backingStateSlots(asset) {
    return [
      kernelAssetSlot(BACKING_AMOUNT_SLOT, asset),
      kernelAssetSlot(ASSET_TOTAL_BORROWED_SLOT, asset),
      TEAM_LOCKED_TOKENS_SLOT
    ];
  }

  function backingPerTokenFromState(backingState, totalSupply) {
    if (!Array.isArray(backingState) || backingState.length !== 3 || totalSupply === null || totalSupply === undefined) {
      return null;
    }

    var redeemBacking = BigInt(backingState[0]);
    var borrowedBacking = BigInt(backingState[1]);
    var teamLocked = BigInt(backingState[2]);
    var supply = BigInt(totalSupply);
    var effectiveSupply = supply > teamLocked ? supply - teamLocked : 0n;

    return effectiveSupply > 0n ? ((redeemBacking + borrowedBacking) * WAD) / effectiveSupply : null;
  }

  // Mirrors BorrowPolicy's Math.mulDiv position check using bigint arithmetic.
  // Using the combined collateral amount preserves the contract's exact rounding.
  function borrowCapacityForAdditionalCollateral(additionalCollateral) {
    var additional = BigInt(additionalCollateral || 0);
    var grossLimit;

    if (
      borrowUiState.backingPerToken === null ||
      borrowUiState.collateral === null ||
      borrowUiState.debt === null
    ) {
      return borrowUiState.available;
    }

    grossLimit = ((borrowUiState.collateral + additional) * borrowUiState.backingPerToken) / WAD;
    return grossLimit > borrowUiState.debt ? grossLimit - borrowUiState.debt : 0n;
  }

  function updateBorrowCapacityPreview() {
    var collateralInput = $("[data-borrow-collateral-input]");
    var borrowInput = $("[data-borrow-amount]");
    var collateralAmount = parseUnits(collateralInput ? collateralInput.value : "", borrowUiState.collateralDecimals);
    var capacity = borrowCapacityForAdditionalCollateral(collateralAmount);

    setText(
      "[data-borrow-limit]",
      (capacity !== null ? formatUnits(capacity, borrowUiState.assetDecimals, 4) : "0.00") + " " + borrowUiState.assetSymbol
    );
    if (borrowInput) {
      borrowInput.dataset.available = capacity !== null ? formatUnitsForInput(capacity, borrowUiState.assetDecimals) : "0";
    }
  }

  // Submit button label tracks what the current inputs will do (deposit, borrow, or both).
  function updateBorrowSubmitLabel() {
    var submit = $("[data-borrow-submit]");
    if (!submit) return;

    if (!borrowUiState.isActive) {
      submit.disabled = true;
      submit.textContent = "Borrowing Unavailable";
      return;
    }

    var collateralInput = $("[data-borrow-collateral-input]");
    var borrowInput = $("[data-borrow-amount]");
    var collateral = collateralInput ? Number(collateralInput.value) : 0;
    var borrowAmount = borrowInput ? Number(borrowInput.value) : 0;
    var hasCollateral = Number.isFinite(collateral) && collateral > 0;
    var hasBorrow = Number.isFinite(borrowAmount) && borrowAmount > 0;

    submit.disabled = false;
    if (hasCollateral && hasBorrow) {
      submit.textContent = "Deposit & Borrow";
    } else if (hasCollateral) {
      submit.textContent = "Deposit Collateral";
    } else if (hasBorrow) {
      submit.textContent = "Borrow " + borrowUiState.assetSymbol;
    } else {
      submit.textContent = "Deposit / Borrow";
    }
  }

  function setBorrowFormActive(active) {
    var badge = $("[data-borrow-badge]");
    if (badge) badge.textContent = active ? "Borrowing Live" : "Borrowing Unavailable";

    updateBorrowSubmitLabel();
  }

  function resetBorrowMetrics() {
    setText("[data-borrow-collateral]", "0.00");
    setText("[data-borrow-debt]", "0.00");
    setText("[data-borrow-available]", "0.00");
    setText("[data-borrow-wallet-capacity]", "0.00");
    setText("[data-borrow-backing-per-token]", "0.00");
    setText("[data-borrow-collateral-amount]", "0.00");
    setText("[data-borrow-enten-balance]", "0.00 ENTEN");
    setText("[data-borrow-limit]", "0.00 " + borrowUiState.assetSymbol);
  }

  async function loadBorrowData() {
    if (!IS_BORROW_PAGE) return;

    var chain = activeBorrowChainConfig();
    var address = borrowAddress(chain);
    var asset = borrowAssetConfig(chain);
    var enten = chain && chain.tokens ? chain.tokens.enten : null;
    var account = state.account;
    var borrowInput = $("[data-borrow-amount]");
    var collateralInput = $("[data-borrow-collateral-input]");
    var canSetStatus = shouldSetPassivePageStatus();
    var client;
    var calls;
    var results = {};

    // The controller/vault and kernel are immutable per borrow market, so drop cached
    // addresses when the active chain changes.
    if (borrowUiState.chainId !== (chain ? chain.chainId : "")) {
      borrowUiState.vaultAddress = "";
      borrowUiState.kernelAddress = "";
    }

    borrowUiState.chainId = chain ? chain.chainId : "";
    borrowUiState.assetSymbol = asset ? asset.symbol : "MEGA";
    borrowUiState.assetAddress = asset && isAddress(asset.address) ? asset.address : "";
    borrowUiState.assetDecimals = asset ? asset.decimals : 18;
    borrowUiState.collateralDecimals = enten ? enten.decimals : 18;
    borrowUiState.kernelAddress = borrowKernelAddress(chain) || borrowUiState.kernelAddress;

    if (!chain || !address) {
      borrowUiState.isActive = false;
      borrowUiState.collateral = null;
      borrowUiState.debt = null;
      borrowUiState.available = null;
      borrowUiState.entenBalance = null;
      borrowUiState.backingPerToken = null;
      borrowUiState.availableWithWallet = null;
      resetBorrowMetrics();
      if (borrowInput) borrowInput.dataset.available = "0";
      if (collateralInput) collateralInput.dataset.available = "0";
      setBorrowFormActive(false);
      if (canSetStatus) {
        setStatus(
          "[data-page-status]",
          "Borrowing is not available on this network. Switch to " + SUPPORTED_CHAINS[DEFAULT_CHAIN_ID].shortName + ".",
          "warn"
        );
      }
      return;
    }

    if (!isAddress(borrowUiState.assetAddress)) {
      setBorrowFormActive(false);
      if (canSetStatus) {
        setStatus("[data-page-status]", "Borrowable asset is not configured on " + chain.shortName + ".", "warn");
      }
      return;
    }

    client = publicClientForChain(chain);

    // Configured deployments take the single-multicall path. The fallback keeps the
    // page portable if a future borrow market omits its immutable Kernel from config.
    if (account && !isAddress(borrowUiState.kernelAddress)) {
      try {
        borrowUiState.kernelAddress = await client.readContract({
          address: address,
          abi: BORROW_POLICY_ABI,
          functionName: "KERNEL"
        });
      } catch (error) {
        borrowUiState.kernelAddress = "";
      }
    }

    calls = [{ key: "active", functionName: "isActive", args: [] }];
    if (account) {
      calls.push({ key: "position", functionName: "userPosition", args: [account] });
      calls.push({ key: "available", functionName: "borrowableForAsset", args: [account, borrowUiState.assetAddress] });
      if (enten && isAddress(enten.address)) {
        calls.push({ key: "entenBalance", address: enten.address, abi: ERC20_ABI, functionName: "balanceOf", args: [account] });
        calls.push({ key: "totalSupply", address: enten.address, abi: ERC20_ABI, functionName: "totalSupply", args: [] });
      }
      if (isAddress(borrowUiState.kernelAddress)) {
        calls.push({
          key: "backingState",
          address: borrowUiState.kernelAddress,
          abi: KERNEL_VIEW_ABI,
          functionName: "viewData",
          args: [backingStateSlots(borrowUiState.assetAddress)]
        });
      }
    }

    try {
      var multicallResults = await client.multicall({
        allowFailure: true,
        contracts: calls.map(function (call) {
          return {
            address: call.address || address,
            abi: call.abi || BORROW_POLICY_ABI,
            functionName: call.functionName,
            args: call.args
          };
        })
      });
      multicallResults.forEach(function (result, index) {
        results[calls[index].key] = result && result.status === "success" ? result.result : null;
      });
    } catch (error) {
      await Promise.all(
        calls.map(async function (call) {
          try {
            results[call.key] = await client.readContract({
              address: call.address || address,
              abi: call.abi || BORROW_POLICY_ABI,
              functionName: call.functionName,
              args: call.args
            });
          } catch (innerError) {
            results[call.key] = null;
          }
        })
      );
    }

    borrowUiState.isActive = Boolean(results.active);

    var collateral = null;
    var debt = null;
    if (results.position) {
      collateral = BigInt(results.position.collateral || 0);
      var match = normalizeBorrowDebt(results.position.debt).find(function (entry) {
        return entry.address.toLowerCase() === borrowUiState.assetAddress.toLowerCase();
      });
      debt = match ? match.amount : 0n;
    }
    var available = results.available !== null && results.available !== undefined ? BigInt(results.available) : null;
    var entenBalance = results.entenBalance !== null && results.entenBalance !== undefined ? BigInt(results.entenBalance) : null;
    var totalSupply = results.totalSupply !== null && results.totalSupply !== undefined ? BigInt(results.totalSupply) : null;
    var backingState = Array.isArray(results.backingState) ? results.backingState : null;
    var backingPerToken = backingPerTokenFromState(backingState, totalSupply);

    borrowUiState.collateral = collateral;
    borrowUiState.debt = debt;
    borrowUiState.available = available;
    borrowUiState.entenBalance = entenBalance;
    borrowUiState.backingPerToken = backingPerToken;
    borrowUiState.availableWithWallet =
      entenBalance !== null && backingPerToken !== null ? borrowCapacityForAdditionalCollateral(entenBalance) : null;

    setText("[data-borrow-collateral]", collateral !== null ? formatUnitsCompact(collateral, borrowUiState.collateralDecimals) : "0.00");
    setText("[data-borrow-collateral-amount]", collateral !== null ? formatUnitsCompact(collateral, borrowUiState.collateralDecimals) : "0.00");
    setText("[data-borrow-debt]", debt !== null ? formatUnitsCompact(debt, borrowUiState.assetDecimals) : "0.00");
    setText("[data-borrow-available]", available !== null ? formatUnitsCompact(available, borrowUiState.assetDecimals) : "0.00");
    setText(
      "[data-borrow-wallet-capacity]",
      borrowUiState.availableWithWallet !== null
        ? formatUnitsCompact(borrowUiState.availableWithWallet, borrowUiState.assetDecimals)
        : "0.00"
    );
    setText(
      "[data-borrow-backing-per-token]",
      backingPerToken !== null ? formatUnits(backingPerToken, borrowUiState.assetDecimals, 6) : "0.00"
    );
    setText(
      "[data-borrow-enten-balance]",
      (entenBalance !== null ? formatUnits(entenBalance, borrowUiState.collateralDecimals, 4) : "0.00") + " ENTEN"
    );
    if (collateralInput) collateralInput.dataset.available = entenBalance !== null ? formatUnitsForInput(entenBalance, borrowUiState.collateralDecimals) : "0";
    updateBorrowCapacityPreview();

    setBorrowFormActive(borrowUiState.isActive);

    if (!canSetStatus) {
      /* Preserve wallet and transaction progress messages during background refreshes. */
    } else if (!borrowUiState.isActive) {
      setStatus("[data-page-status]", "Borrowing is currently paused.", "warn");
    } else if (!account) {
      setStatus("[data-page-status]", "Connect a wallet to deposit ENTEN and borrow.", "warn");
    } else if (collateral !== null && collateral <= 0n) {
      setStatus("[data-page-status]", "Deposit ENTEN collateral to unlock borrowing capacity.", "warn");
    } else {
      setStatus("[data-page-status]", "Live borrow market loaded from " + chain.shortName + ".", "ok");
    }
  }

  async function ensureBorrowNetwork(actionLabel) {
    var chain = currentChainConfig();
    var targetChain = activeBorrowChainConfig();

    if (borrowAddress(chain)) return true;

    if (!targetChain || !borrowAddress(targetChain)) {
      setStatus("[data-page-status]", "Borrowing is not configured on a supported network yet.", "warn");
      return false;
    }

    if (!state.provider) return false;

    setStatus("[data-page-status]", "Switching wallet to " + targetChain.shortName + " for " + actionLabel + ".", "warn");

    try {
      return await switchNetwork(targetChain.chainId);
    } catch (error) {
      setStatus("[data-page-status]", "Switch to " + targetChain.shortName + " before continuing.", "warn");
      return false;
    }
  }

  // Collateral (ENTEN) is pulled by the controller's Vault, so that's the approve spender.
  // Resolved as VAULT(CONTROLLER(borrowPolicy)) and cached per chain (it is immutable).
  async function resolveBorrowVault(chain) {
    if (isAddress(borrowUiState.vaultAddress) && borrowUiState.chainId === chain.chainId) {
      return borrowUiState.vaultAddress;
    }

    var client = publicClientForChain(chain);
    var controller = borrowControllerAddress(chain);
    if (!isAddress(controller)) {
      controller = await client.readContract({
        address: borrowAddress(chain),
        abi: BORROW_POLICY_ABI,
        functionName: "CONTROLLER"
      });
    }
    if (!isAddress(controller)) throw new Error("Could not resolve the borrow controller.");

    var vault = await client.readContract({
      address: controller,
      abi: CONTROLLER_VIEW_ABI,
      functionName: "VAULT"
    });
    borrowUiState.vaultAddress = isAddress(vault) ? vault : "";
    return borrowUiState.vaultAddress;
  }

  // Returns an {to,data,value} ENTEN approve tx if the collateral allowance is short,
  // else null. Used to batch approve + deposit atomically for MOSS.
  async function borrowApproveTxIfNeeded(chain, collateralAmount) {
    var enten = chain && chain.tokens ? chain.tokens.enten : null;
    if (!enten || !isAddress(enten.address)) throw new Error("ENTEN collateral token is not configured.");

    var spender = await resolveBorrowVault(chain);
    if (!isAddress(spender)) throw new Error("Could not resolve the collateral vault spender for approval.");

    var allowance = await tokenAllowance(enten.address, state.account, spender, chain);
    if (allowance >= collateralAmount) return null;
    return buildApproveTokenTransaction(enten.address, spender, collateralAmount);
  }

  // Sequential collateral approval for injected wallets (MOSS batches instead).
  async function ensureBorrowCollateralApproval(chain, collateralAmount) {
    var enten = chain && chain.tokens ? chain.tokens.enten : null;
    var spender;
    var allowance;
    var approvalTx;
    var receipt;
    var txHash;

    if (!enten || !isAddress(enten.address)) {
      setStatus("[data-page-status]", "ENTEN collateral token is not configured.", "warn");
      return false;
    }

    try {
      spender = await resolveBorrowVault(chain);
    } catch (error) {
      spender = "";
    }
    if (!isAddress(spender)) {
      setStatus("[data-page-status]", "Could not resolve the collateral vault spender for approval.", "warn");
      return false;
    }

    try {
      allowance = await tokenAllowance(enten.address, state.account, spender, chain);
    } catch (error) {
      setStatus("[data-page-status]", "Could not read ENTEN allowance.", "warn");
      return false;
    }

    if (allowance >= collateralAmount) return true;

    approvalTx = buildApproveTokenTransaction(enten.address, spender, collateralAmount);

    setStatus("[data-page-status]", "Simulating ENTEN approval...", "warn");
    try {
      await simulateTransaction(approvalTx, chain);
    } catch (error) {
      setStatus("[data-page-status]", "ENTEN approval preflight failed: " + simulationFailureMessage(error), "warn");
      return false;
    }

    setStatus("[data-page-status]", "Approving ENTEN collateral...", "warn");
    txHash = await sendTransaction(approvalTx, chain);

    setStatus("[data-page-status]", "Waiting for ENTEN approval...", "warn");
    receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", "ENTEN approval is still pending. Try again after it confirms.", "warn");
      return false;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", "ENTEN approval reverted.", "warn");
      return false;
    }

    return true;
  }

  // Builds the deposit / depositAndBorrow / borrow calldata for the requested amounts.
  // Pure-borrow against the exact remaining limit uses borrowMax() to avoid dust reverts.
  function buildBorrowActionTx(address, asset, collateralAmount, borrowAmount) {
    var data;
    if (collateralAmount > 0n && borrowAmount > 0n) {
      data = encodeFunctionData({
        abi: BORROW_POLICY_ABI,
        functionName: "depositAndBorrow",
        args: [collateralAmount, [{ asset: asset.address, amount: borrowAmount }]]
      });
    } else if (collateralAmount > 0n) {
      data = encodeFunctionData({ abi: BORROW_POLICY_ABI, functionName: "deposit", args: [collateralAmount] });
    } else {
      var useBorrowMax = borrowUiState.available !== null && borrowUiState.available > 0n && borrowAmount === borrowUiState.available;
      data = useBorrowMax
        ? encodeFunctionData({ abi: BORROW_POLICY_ABI, functionName: "borrowMax", args: [] })
        : encodeFunctionData({
            abi: BORROW_POLICY_ABI,
            functionName: "borrow",
            args: [[{ asset: asset.address, amount: borrowAmount }]]
          });
    }

    return { from: state.account, to: address, data: data, value: "0x0" };
  }

  async function submitBorrow() {
    var chain = currentChainConfig();
    var collateralInput = $("[data-borrow-collateral-input]");
    var borrowInput = $("[data-borrow-amount]");
    var address = borrowAddress(chain);
    var asset = borrowAssetConfig(chain);
    var enten = chain && chain.tokens ? chain.tokens.enten : null;
    var collateralAmount;
    var borrowAmount;
    var actionTx;
    var receipt;
    var txHash;

    if (!address) {
      setStatus("[data-page-status]", "Borrowing is not available on this network.", "warn");
      return;
    }

    if (!borrowUiState.isActive) {
      setStatus("[data-page-status]", "Borrowing is currently paused.", "warn");
      return;
    }

    collateralAmount = parseUnits(collateralInput ? collateralInput.value : "", enten ? enten.decimals : 18);
    borrowAmount = asset ? parseUnits(borrowInput ? borrowInput.value : "", asset.decimals) : 0n;

    if (collateralAmount <= 0n && borrowAmount <= 0n) {
      setStatus("[data-page-status]", "Enter an amount of ENTEN to deposit or " + borrowUiState.assetSymbol + " to borrow.", "warn");
      if (collateralInput) collateralInput.focus();
      return;
    }

    if (collateralAmount > 0n && borrowUiState.entenBalance !== null && collateralAmount > borrowUiState.entenBalance) {
      setStatus("[data-page-status]", "Collateral exceeds your ENTEN balance.", "warn");
      return;
    }

    if (borrowAmount > 0n && (!asset || !isAddress(asset.address))) {
      setStatus("[data-page-status]", "Borrowable asset is not configured on this network.", "warn");
      return;
    }

    if (borrowAmount > 0n) {
      var previewCapacity = borrowCapacityForAdditionalCollateral(collateralAmount);
      var canValidateCapacity = collateralAmount <= 0n || borrowUiState.backingPerToken !== null;
      if (canValidateCapacity && previewCapacity !== null && borrowAmount > previewCapacity) {
        setStatus("[data-page-status]", "Borrow exceeds the capacity provided by this deposit.", "warn");
        return;
      }
    }

    actionTx = buildBorrowActionTx(address, asset, collateralAmount, borrowAmount);

    console.log("[borrow] action tx built", {
      to: actionTx.to,
      collateral: String(collateralAmount),
      borrow: String(borrowAmount)
    });

    if (isMossWallet()) {
      // MOSS fails on two sequential callContract calls, so batch the ENTEN approval and
      // the deposit/borrow into ONE atomic call (the approve runs first within the tx).
      var batch = [];
      if (collateralAmount > 0n) {
        try {
          var approveTx = await borrowApproveTxIfNeeded(chain, collateralAmount);
          if (approveTx) batch.push(approveTx);
        } catch (error) {
          setStatus("[data-page-status]", error && error.message ? error.message : "Could not prepare the approval.", "warn");
          return;
        }
      }
      batch.push(actionTx);

      // Only the no-approve case can be preflight-simulated standalone (with an approve in
      // the batch the allowance isn't set yet); otherwise rely on the atomic batch reverting.
      if (batch.length === 1) {
        setStatus("[data-page-status]", "Simulating transaction...", "warn");
        try {
          await simulateTransaction(actionTx, chain);
        } catch (error) {
          console.error("[borrow] preflight (simulation) reverted", error);
          setStatus("[data-page-status]", "Preflight failed: " + simulationFailureMessage(error), "warn");
          return;
        }
      }

      setStatus("[data-page-status]", batch.length > 1 ? "Submitting approve + transaction..." : "Submitting transaction...", "warn");
      try {
        txHash = await mossSendCalls(batch);
      } catch (error) {
        if (error && error.code === 4001) {
          setStatus("[data-page-status]", "Transaction was rejected.", "warn");
        } else {
          setStatus("[data-page-status]", "Transaction failed: " + (error && error.message ? error.message : "unknown error"), "warn");
        }
        return;
      }
    } else {
      // Injected wallets: sequential approve, then the action (works fine there).
      if (collateralAmount > 0n && !(await ensureBorrowCollateralApproval(chain, collateralAmount))) {
        return;
      }

      setStatus("[data-page-status]", "Simulating transaction...", "warn");
      try {
        await simulateTransaction(actionTx, chain);
      } catch (error) {
        console.error("[borrow] preflight (simulation) reverted", error);
        setStatus("[data-page-status]", "Preflight failed: " + simulationFailureMessage(error), "warn");
        return;
      }

      setStatus("[data-page-status]", "Submitting transaction...", "warn");
      try {
        txHash = await sendTransaction(actionTx, chain);
      } catch (error) {
        if (error && error.code === 4001) {
          setStatus("[data-page-status]", "Transaction was rejected.", "warn");
        } else {
          setStatus("[data-page-status]", "Transaction failed: " + (error && error.message ? error.message : "unknown error"), "warn");
        }
        return;
      }
    }

    setStatus("[data-page-status]", "Submitted: " + txHash.slice(0, 10) + "... waiting for confirmation.", "ok");
    refreshBorrowDataSoon();

    receipt = await waitForTransaction(txHash, chain);
    if (!receipt) {
      setStatus("[data-page-status]", "Submitted and still pending. Data will refresh after confirmation.", "warn");
      return;
    }
    if (receipt.status === "0x0") {
      setStatus("[data-page-status]", "Transaction reverted.", "warn");
      loadBorrowData();
      return;
    }

    setStatus("[data-page-status]", "Confirmed: " + txHash.slice(0, 10) + "...", "ok");
    if (collateralInput) collateralInput.value = "";
    if (borrowInput) borrowInput.value = "";
    loadBorrowData();
  }

  function bindBorrowPage() {
    if (!IS_BORROW_PAGE) return;

    var form = $("[data-borrow-form]");
    var borrowInput = $("[data-borrow-amount]");
    var borrowMaxButton = $("[data-borrow-max]");
    var collateralInput = $("[data-borrow-collateral-input]");
    var collateralMaxButton = $("[data-borrow-collateral-max]");

    loadBorrowData();
    startBorrowAutoRefresh();

    function bindMax(button, input) {
      if (!button || !input) return;
      button.addEventListener("click", function () {
        input.value = input.dataset.available || "0";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }

    function bindAmountInput(input) {
      if (!input) return;
      input.addEventListener("input", function () {
        var amount = Number(input.value);
        var isValid = Number.isFinite(amount) && amount > 0;
        input.setAttribute("aria-invalid", isValid || !input.value ? "false" : "true");
        if (input === collateralInput) updateBorrowCapacityPreview();
        updateBorrowSubmitLabel();
      });
    }

    bindMax(borrowMaxButton, borrowInput);
    bindMax(collateralMaxButton, collateralInput);
    bindAmountInput(borrowInput);
    bindAmountInput(collateralInput);

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!state.account && !(await connectWallet())) return;
        if (!(await ensureBorrowNetwork("borrowing"))) return;

        try {
          await submitBorrow();
        } catch (error) {
          setStatus("[data-page-status]", "Borrow transaction failed or was rejected.", "warn");
        }
      });
    }
  }

  function init() {
    // Debug handle keeps the SDK lazy while preserving permission inspection.
    try {
      window.__entenMoss = {
        load: loadMossSdk,
        getPermissions: function () {
          return withMossSdk(function (mega) { return mega.getPermissions(); });
        },
        revokePermissions: function () {
          return withMossSdk(function (mega) { return mega.revokePermissions(); });
        }
      };
    } catch (error) {
      /* window may be locked down in some contexts. */
    }

    updateNav();
    bindWalletControls();
    bindNetworkSwitcher();
    if (IS_PRESALE_PAGE) bindPresalePage();
    if (IS_AUCTION_PAGE) bindAuctionPage();
    if (IS_SWAP_PAGE) bindSwapPage();
    if (IS_LAUNCH_PAGE) bindLaunchPage();
    if (IS_WALLET_PAGE) bindWalletPage();
    if (IS_BORROW_PAGE) bindBorrowPage();
    restoreWalletSession();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
