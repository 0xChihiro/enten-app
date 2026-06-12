import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  formatUnits as viemFormatUnits,
  http,
  parseAbi,
  parseUnits as viemParseUnits
} from "https://esm.sh/viem@2.45.2";

(function () {
  "use strict";

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
    "0x2105": {
      chainId: "0x2105",
      chainName: "Base",
      shortName: "Base",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      },
      rpcUrls: ["https://mainnet.base.org"],
      blockExplorerUrls: ["https://basescan.org"],
      chainIdDecimal: 8453,
      multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
      uniswap: {
        universalRouter: "0x6fF5693b99212Da76ad316178A184AB56D299b43",
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
          address: "",
          symbol: "ENTEN",
          name: "Enten",
          decimals: 18
        },
        quotes: [
          {
            id: "ETH",
            address: "native",
            wrappedAddress: "0x4200000000000000000000000000000000000006",
            symbol: "ETH",
            name: "Ethereum",
            decimals: 18,
            native: true
          },
          {
            id: "USDC",
            address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6
          },
          {
            id: "USDBC",
            address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
            symbol: "USDbC",
            name: "Bridged USDC",
            decimals: 6
          },
          {
            id: "DAI",
            address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18
          }
        ]
      },
      auction: {
        address: "",
        vaultAddress: "",
        mintDecimals: 18,
        deadlineSeconds: 1200,
        maxPayments: []
      }
    },
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
          address: "",
          symbol: "ENTEN",
          name: "Enten",
          decimals: 18
        },
        quotes: [
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
        vaultAddress: "",
        mintDecimals: 18,
        deadlineSeconds: 1200,
        maxPayments: []
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
          address: "0x71DD8C7B45234E7D57B69b79e1F2D1E604434eC0",
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
        vaultAddress: "0x34d500707F2f9Dd825c71bbeEEFBd209B3511A45",
        mintDecimals: 18,
        deadlineSeconds: 1200,
        maxPayments: []
      }
    }
  };

  var DEFAULT_CHAIN_ID = "0x2105";
  var PREFERRED_CHAIN_KEY = "enten.preferredChainId";
  var NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

  var ERC20_ABI = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
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

  var VAULT_ABI = parseAbi(["function backingBalances() view returns ((address token, uint256 amount)[])"]);

  var state = {
    account: "",
    chainId: "",
    provider: null
  };

  var announcedProviders = [];
  var boundProvider = null;
  var lastProviderSource = "none";
  var walletModal = null;
  var swapUiState = {
    reversed: false,
    quoteId: "ETH"
  };
  var auctionUiState = {
    remainingLot: null,
    prices: [],
    mintDecimals: 18,
    chainId: ""
  };
  var auctionCountdownTimer = null;

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
      ".enten-wallet-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(12,13,18,.72);backdrop-filter:blur(18px);color:#f4f4f2;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:0}" +
      ".enten-wallet-modal[data-open='true']{display:flex}" +
      ".enten-wallet-dialog{position:relative;width:min(100%,460px);border:1px solid rgba(244,244,242,.14);border-radius:0;background:rgba(12,13,18,.94);box-shadow:0 28px 90px rgba(0,0,0,.5);overflow:hidden}" +
      ".enten-wallet-dialog:before{position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(239,161,67,.5),transparent);content:'';opacity:.8}" +
      ".enten-wallet-dialog:after{position:absolute;right:-120px;bottom:-120px;width:260px;height:260px;border-radius:999px;background:rgba(76,178,168,.07);filter:blur(70px);content:'';pointer-events:none}" +
      ".enten-wallet-head{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:22px;padding:28px 28px 20px;border-bottom:1px solid rgba(244,244,242,.08);background-image:linear-gradient(rgba(244,244,242,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(244,244,242,.022) 1px,transparent 1px);background-size:24px 24px}" +
      ".enten-wallet-kicker{display:flex;align-items:center;gap:12px;margin-bottom:12px;color:rgba(244,244,242,.58);font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase}" +
      ".enten-wallet-kicker:before{display:block;width:12px;height:1px;background:#efa143;content:''}" +
      ".enten-wallet-title{margin:0 0 8px;color:#f4f4f2;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;letter-spacing:0;line-height:1.02}" +
      ".enten-wallet-sub{max-width:310px;margin:0;color:rgba(244,244,242,.6);font-size:13px;font-weight:300;line-height:1.55}" +
      ".enten-wallet-close{border:0;background:transparent;color:rgba(244,244,242,.56);font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;transition:color .25s ease}" +
      ".enten-wallet-close:hover{color:#efa143}" +
      ".enten-wallet-list{position:relative;z-index:1;display:grid;gap:10px;padding:18px}" +
      ".enten-wallet-option{display:grid;grid-template-columns:44px minmax(0,1fr);gap:14px;align-items:center;width:100%;min-height:72px;padding:14px;border:1px solid rgba(244,244,242,.1);border-radius:0;background:rgba(244,244,242,.025);color:#f4f4f2;text-align:left;cursor:pointer;transition:border-color .25s ease,background-color .25s ease,transform .25s ease}" +
      ".enten-wallet-option:hover{border-color:rgba(239,161,67,.55);background:rgba(239,161,67,.07);transform:translateY(-1px)}" +
      ".enten-wallet-badge{display:grid;width:44px;height:44px;place-items:center;border:1px solid rgba(76,178,168,.32);border-radius:0;background:rgba(76,178,168,.08);color:#4cb2a8;font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase}" +
      ".enten-wallet-name{display:block;margin-bottom:6px;color:#f4f4f2;font-size:15px;font-weight:500;line-height:1.15}" +
      ".enten-wallet-meta{display:block;color:rgba(244,244,242,.46);font-family:'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:10px;letter-spacing:.08em;line-height:1.35;text-transform:uppercase;overflow-wrap:anywhere}" +
      ".enten-wallet-empty{position:relative;z-index:1;padding:20px 28px 28px;color:rgba(244,244,242,.62);font-size:13px;font-weight:300;line-height:1.55}" +
      "@media(max-width:560px){.enten-wallet-modal{padding:16px}.enten-wallet-title{font-size:30px}.enten-wallet-head{padding:24px 22px 18px}.enten-wallet-list{padding:14px}.enten-wallet-option{min-height:68px}}";
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
      '<p class="enten-wallet-sub">Select an injected provider to route auction, portal, and network actions through this session.</p></div>' +
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
        var name = providerEntryName(entry);
        var rdns = entry.info && entry.info.rdns ? entry.info.rdns : entry.source || "injected";

        button.className = "enten-wallet-option";
        button.type = "button";
        button.innerHTML =
          '<span class="enten-wallet-badge"></span>' +
          '<span><span class="enten-wallet-name"></span><span class="enten-wallet-meta"></span></span>';
        $(".enten-wallet-badge", button).textContent = walletInitials(name);
        $(".enten-wallet-name", button).textContent = name;
        $(".enten-wallet-meta", button).textContent = rdns;
        button.addEventListener("click", function () {
          lastProviderSource = entry.source || "injected";
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

  function formatUnits(value, decimals, maxFractionDigits) {
    var formatted = viemFormatUnits(BigInt(value || 0), decimals);
    var parts = formatted.split(".");
    var whole = parts[0];
    var fraction = parts[1] || "";
    var trimmed = fraction.slice(0, maxFractionDigits || 4).replace(/0+$/, "");

    return trimmed ? whole.toString() + "." + trimmed : whole.toString();
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
    return state.provider && chain && state.chainId && state.chainId.toLowerCase() === chain.chainId.toLowerCase();
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

  function refreshSwapBalancesSoon(delayMs) {
    window.setTimeout(loadSwapBalances, delayMs || 1500);
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
    var chain = kind === "swap" ? currentChainConfig() || activeSwapChainConfig() : kind === "auction" ? currentChainConfig() || activeAuctionChainConfig() : currentChainConfig();
    if (!chain) return "";

    if (kind === "auction") {
      return chain.auction && chain.auction.address ? chain.auction.address : "";
    }

    if (kind === "swap") {
      return chain.uniswap && chain.uniswap.universalRouter ? chain.uniswap.universalRouter : "";
    }

    return "";
  }

  function updateContractLabels() {
    setText("[data-auction-address]", contractAddress("auction") || "Not configured");
    setText("[data-swap-address]", contractAddress("swap") || "Not configured");
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
    setText("[data-route-label]", pair.pay.symbol + " -> " + pair.receive.symbol + " (Universal Router)");
    setText("[data-price-label]", "Best price via V2/V3/V4 route");
  }

  function renderSwapControls() {
    var chain = activeSwapChainConfig();
    var quotes = quoteTokenConfigs(chain);
    var pair = currentSwapTokens(chain);
    var enten = outputTokenConfig(chain);

    if (!pair.pay || !pair.receive || !enten || !quotes.length) return;

    setAssetSelector("[data-pay-asset]", swapUiState.reversed ? [enten] : quotes, pair.pay);
    setAssetSelector("[data-receive-asset]", swapUiState.reversed ? quotes : [enten], pair.receive);
    setTokenName("[data-pay-name]", pair.pay);
    setTokenName("[data-receive-name]", pair.receive);
    setBalancePlaceholder("[data-pay-balance]", pair.pay);
    setBalancePlaceholder("[data-receive-balance]", pair.receive);
    updateSwapRouteLabels();
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

  function routeTokenAddress(token) {
    if (!token) return "";
    return token.native ? NATIVE_TOKEN_ADDRESS : token.address;
  }

  function canRouteToken(token) {
    return token && (token.native || isAddress(token.address));
  }

  function buildRouteRequest(chain, pair, amountIn) {
    return {
      type: "EXACT_INPUT",
      amount: amountIn.toString(),
      tokenInChainId: chain.chainIdDecimal,
      tokenOutChainId: chain.chainIdDecimal,
      tokenIn: routeTokenAddress(pair.pay),
      tokenOut: routeTokenAddress(pair.receive),
      swapper: state.account,
      slippageTolerance: chain.uniswap.slippageTolerance,
      protocols: chain.uniswap.protocols,
      routingPreference: chain.uniswap.routingPreference,
      universalRouterVersion: chain.uniswap.universalRouterVersion,
      universalRouter: chain.uniswap.universalRouter
    };
  }

  async function fetchUniversalRouterPlan(chain, routeRequest) {
    var endpoint = chain.uniswap.routeApiUrl || window.ENTEN_ROUTE_API || "";
    var response;

    if (!endpoint) {
      var missingEndpoint = new Error("Universal Router route endpoint is not configured.");
      missingEndpoint.code = "NO_ROUTE_ENDPOINT";
      throw missingEndpoint;
    }

    response = await window.fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(routeRequest)
    });

    if (!response.ok) {
      throw new Error("Route request failed with HTTP " + response.status + ".");
    }

    return response.json();
  }

  function routePlanTransaction(plan) {
    if (!plan) return null;
    return plan.swap || plan.transaction || plan.tx || plan;
  }

  function routePlanApprovalTransactions(plan) {
    var approvals = [];

    ["approval", "approvalTransaction", "approvalTx", "permit2Approval"].forEach(function (key) {
      var item = plan && plan[key];
      if (!item) return;
      if (Array.isArray(item)) {
        approvals = approvals.concat(item);
      } else {
        approvals.push(item);
      }
    });

    return approvals
      .map(function (approval) {
        return approval && (approval.transaction || approval.tx || approval);
      })
      .filter(function (approval) {
        return approval && isAddress(approval.to) && /^0x[0-9a-fA-F]*$/.test(String(approval.data || ""));
      });
  }

  async function submitApprovalTransactions(plan) {
    var approvals = routePlanApprovalTransactions(plan);

    for (var index = 0; index < approvals.length; index += 1) {
      var approval = approvals[index];
      var receipt;
      var approvalTx;
      var txHash;

      approvalTx = {
        from: state.account,
        to: approval.to,
        data: approval.data || "0x",
        value: approval.value === undefined ? 0n : approval.value
      };

      setStatus("[data-page-status]", "Simulating approval " + (index + 1) + " of " + approvals.length + "...", "warn");
      await simulateTransaction(approvalTx);

      setStatus("[data-page-status]", "Submitting approval " + (index + 1) + " of " + approvals.length + "...", "warn");
      txHash = await sendTransaction(approvalTx);

      setStatus("[data-page-status]", "Waiting for approval confirmation...", "warn");
      receipt = await waitForTransaction(txHash);
      if (!receipt) {
        throw new Error("Approval is still pending.");
      }
      if (receipt.status === "0x0") {
        throw new Error("Approval transaction reverted.");
      }
    }
  }

  function normalizedRouteTransaction(plan, chain, pair, amountIn) {
    var tx = routePlanTransaction(plan);
    var to = tx && tx.to ? tx.to : chain.uniswap.universalRouter;
    var data = tx && tx.data ? tx.data : "";
    var value = tx && tx.value !== undefined ? tx.value : pair.pay.native ? amountIn : 0n;

    if (!isAddress(to) || to.toLowerCase() !== chain.uniswap.universalRouter.toLowerCase()) {
      throw new Error("Route did not target the configured Universal Router.");
    }
    if (!/^0x[0-9a-fA-F]+$/.test(String(data || ""))) {
      throw new Error("Route did not include valid calldata.");
    }

    return {
      from: state.account,
      to: to,
      data: data,
      value: value
    };
  }

  function updateReceiveAmountFromPlan(plan, receiveToken) {
    var amountOut =
      plan &&
      (plan.amountOut ||
        plan.outputAmount ||
        (plan.quote && (plan.quote.amountOut || plan.quote.outputAmount || plan.quote.quote)));
    var receiveInput = $("[data-receive-input]");

    if (amountOut !== undefined && receiveInput && receiveToken) {
      receiveInput.value = formatUnits(BigInt(amountOut), receiveToken.decimals, 6);
    }
  }

  async function submitUniversalRouterSwap() {
    var chain = currentChainConfig();
    var pair = chain ? currentSwapTokens(chain) : { pay: null, receive: null };
    var input = $("[data-pay-input]");
    var amountIn;
    var plan;
    var routeRequest;
    var routeTx;
    var txHash;

    if (!chain || !chain.uniswap || !isAddress(chain.uniswap.universalRouter)) {
      setStatus("[data-page-status]", "Unsupported network for Universal Router swaps.", "warn");
      return;
    }

    if (!pair.pay || !pair.receive || !canRouteToken(pair.pay) || !canRouteToken(pair.receive)) {
      setStatus("[data-page-status]", "Configure the Enten token address before enabling routes.", "warn");
      return;
    }

    amountIn = parseUnits(input ? input.value : "", pair.pay.decimals);
    if (amountIn <= 0n) {
      setStatus("[data-page-status]", "Enter an amount to swap.", "warn");
      return;
    }

    routeRequest = buildRouteRequest(chain, pair, amountIn);

    setStatus("[data-page-status]", "Requesting Universal Router route...", "warn");
    try {
      plan = await fetchUniversalRouterPlan(chain, routeRequest);
      updateReceiveAmountFromPlan(plan, pair.receive);
      await submitApprovalTransactions(plan);
      routeTx = normalizedRouteTransaction(plan, chain, pair, amountIn);
      setStatus("[data-page-status]", "Simulating Universal Router swap...", "warn");
      await simulateTransaction(routeTx, chain);
    } catch (error) {
      if (error && error.code === "NO_ROUTE_ENDPOINT") {
        setStatus("[data-page-status]", "Configure a route endpoint before enabling Universal Router swaps.", "warn");
      } else {
        setStatus("[data-page-status]", "Swap preflight failed: " + simulationFailureMessage(error), "warn");
      }
      return;
    }

    setStatus("[data-page-status]", "Submitting Universal Router swap...", "warn");
    txHash = await sendTransaction(routeTx);

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

    if (results.remaining !== null && results.remaining !== undefined) {
      auctionUiState.remainingLot = results.remaining;
      soldOut = results.remaining <= 0n;
      setText("[data-auction-amountLeft]", formatUnitsCompact(results.remaining, auction.mintDecimals === undefined ? 18 : auction.mintDecimals));
      setText("[data-auction-amountLeft-unit]", chain.tokens && chain.tokens.enten ? chain.tokens.enten.symbol : "ENTEN");
    } else {
      auctionUiState.remainingLot = null;
    }

    if (results.lotSize !== null && results.lotSize !== undefined) {
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
    renderSwapControls();
    loadAuctionData();
    if (state.account) {
      loadSwapBalances();
    }
  }

  async function getProviderState() {
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
      setStatus("[data-page-status]", "Switch to Base, MegaETH, or MegaETH Testnet before continuing.", "warn");
      return false;
    }
  }

  async function connectWallet() {
    var entries = await discoverProviderEntries(500);
    var selectedEntry;

    if (!entries.length) {
      setStatus("[data-page-status]", "No injected wallet found. Open this page over localhost and allow your wallet extension on this site.", "warn");
      state.provider = null;
      updateWalletUi();
      return false;
    }

    selectedEntry = await openWalletSelector(entries);

    if (!selectedEntry) {
      setStatus("[data-page-status]", "Wallet selection was cancelled.", "warn");
      updateWalletUi();
      return false;
    }

    state.provider = selectedEntry.provider;
    lastProviderSource = selectedEntry.source || "injected";
    bindProviderEvents(state.provider);

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

    state.provider = getProvider();
    bindProviderEvents(state.provider);
  }

  function bindAuctionPage() {
    var form = $("[data-auction-form]");
    var amountInput = $("#bidAmount");
    var maxButton = $("[data-auction-max-amount]");
    var buyMaxButton = $("[data-auction-buy-max]");
    var startNextButton = $("[data-auction-start-next]");
    if (!form) return;

    updateContractLabels();
    loadAuctionData();

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
        if (!(await ensureSupportedNetwork("buying the remaining lot"))) return;

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
      if (!(await ensureSupportedNetwork("buying"))) return;

      try {
        await submitAuctionBuy();
      } catch (error) {
        setStatus("[data-page-status]", "Auction transaction failed or was rejected.", "warn");
      }
    });

    if (startNextButton) {
      startNextButton.addEventListener("click", async function () {
        if (!state.account && !(await connectWallet())) return;
        if (!(await ensureSupportedNetwork("starting the next auction"))) return;

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

    function onAssetChange(event) {
      var value = event.detail && event.detail.value ? event.detail.value : event.currentTarget.dataset.value;
      if (value && value !== "ENTEN") {
        swapUiState.quoteId = value;
      }
      renderSwapControls();
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

    if (payInput && receiveInput) {
      payInput.addEventListener("input", function () {
        receiveInput.value = "";
        updateSwapRouteLabels();
      });
    }

    if (flip) {
      flip.addEventListener("click", function () {
        var payValue = payInput ? payInput.value : "";
        var receiveValue = receiveInput ? receiveInput.value : "";

        swapUiState.reversed = !swapUiState.reversed;
        if (payInput) {
          payInput.value = receiveValue;
        }
        if (receiveInput) {
          receiveInput.value = payValue;
        }
        renderSwapControls();
        window.setTimeout(loadSwapBalances, 0);
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!state.account && !(await connectWallet())) return;
      if (!(await ensureSupportedNetwork("swapping"))) return;

      try {
        await submitUniversalRouterSwap();
      } catch (error) {
        setStatus("[data-page-status]", "Swap transaction failed or was rejected.", "warn");
      }
    });
  }

  function init() {
    updateNav();
    bindWalletControls();
    bindAuctionPage();
    bindSwapPage();
    getProviderState();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
