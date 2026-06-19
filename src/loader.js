var pageLoaders = {
  auction: function () { return import("./app-auction.js"); },
  launch: function () { return import("./app-launch.js"); },
  presale: function () { return import("./app-presale.js"); },
  swap: function () { return import("./app-swap.js"); },
  wallet: function () { return import("./app-wallet.js"); }
};

var page = document.querySelector("[data-presale-page]")
  ? "presale"
  : document.querySelector("[data-wallet-page]")
    ? "wallet"
    : document.querySelector("[data-auction-page]")
      ? "auction"
      : document.querySelector("[data-swap-page]")
        ? "swap"
        : document.querySelector("[data-launch-page]")
          ? "launch"
          : "";

if (pageLoaders[page]) pageLoaders[page]();
