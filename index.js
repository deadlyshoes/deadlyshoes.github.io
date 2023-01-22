async function handleLogin(e) {
	e.preventDefault();

	let formParams = new URLSearchParams(new FormData(event.target));
	const response = await fetch("https://localhost:7053/api/User/login?" + formParams.toString(), {
		method: "GET",
		mode: "cors"
	});
	if (response.ok) {
		let info = await response.json();
		sessionStorage.setItem("userId", info.id);
		window.location.href = "./draw.html";
	}
}