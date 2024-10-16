function sendToMail(event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("message").value;

  if (name == "") {
    return alert("Nama tidak boleh kosong!");
  } else if (email == "") {
    return alert("Email tidak boleh kosong!");
  } else if (phone == "") {
    return alert("Phone tidak boleh kosong!");
  } else if (subject == "") {
    return alert("Subject tidak boleh kosong!");
  } else if (message == "") {
    return alert("Message tidak boleh kosong!");
  }

  console.log(name);
  console.log(email);
  console.log(phone);
  console.log(subject);
  console.log(message);

  const a = document.createElement("a");
  a.href = `mailto:${email}?subject=${subject}&body=${message}`;
  a.click();
}
