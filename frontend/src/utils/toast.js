import Swal from "sweetalert2";

function notify(message, icon) {
  const isDark = document.documentElement.classList.contains("dark");
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title: message,
    showConfirmButton: false,
    showCloseButton: true,
    timer: 3200,
    timerProgressBar: true,
    background: isDark ? "#111A2C" : "#FFFFFF",
    color: isDark ? "#E7ECF6" : "#172033",
    customClass: {
      popup: "inventory-toast",
      timerProgressBar: icon === "error" ? "inventory-toast-error" : "inventory-toast-success",
    },
    didOpen: (element) => {
      element.addEventListener("mouseenter", Swal.stopTimer);
      element.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
}

export const toast = {
  success: (message) => notify(message, "success"),
  error: (message) => notify(message || "Something went wrong. Please try again.", "error"),
  info: (message) => notify(message, "info"),
};
