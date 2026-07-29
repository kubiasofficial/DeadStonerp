// Lokální vývoj: statický web na :8000, API na :3000.
// V produkci změňte hodnotu na veřejnou adresu backendu.
window.DEADSTONE_CONFIG = {
  apiBase: ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:3000"
    : window.location.origin
};
