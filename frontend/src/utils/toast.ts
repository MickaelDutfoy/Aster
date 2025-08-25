export function showToast(message: string, duration = 3000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const exists = document.querySelector(".toast");

    if (exists) exists.remove();
  
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
  
    container.appendChild(toast);
  
    setTimeout(() => {
      toast.classList.add("hide");
      toast.addEventListener("transitionend", () => {
        toast.remove();
      });
    }, duration);
}  