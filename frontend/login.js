
const API_URL = "http://localhost:5000";

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    try {
        message.textContent = "Logging in...";

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Login failed.";
            return;
        }

        if (!data.token || !data.user) {
            message.textContent = "Invalid login response from server.";
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "provider") {
            window.location.href = "provider.html";
        } else {
            window.location.href = "index.html";
        }

    } catch (error) {
        console.error("Login error:", error);
        message.textContent = "Cannot connect to the server.";
    }
});
