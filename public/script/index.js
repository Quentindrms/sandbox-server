
const app = document.getElementById("app");

const form = document.getElementById("form");
const firstNameInput = document.getElementById("firstNameInput");
const lastnameInput = document.getElementById("lastNameInput"); 
const responseContent = document.getElementById("responseContent");

const firstNameResponse = document.createElement("p");
const lastNameResponse = document.createElement("p");

let firstname;
let lastname;

form.addEventListener("submit", async (event) => {
	event.preventDefault();
    if(!firstname || !lastname){
        console.log("Les champs du formulaire n'ont pas été remplis")
        return; 
    }
    const data = await submitForm(); 
    displayFormResponse(data);
});

firstNameInput.addEventListener("input", (event) => {
	setFirstName(event.target.value);
});

lastnameInput.addEventListener("input", (event) => {
    setLastName(event.target.value)
})


function setFirstName(input) {
	firstname = input;
}

function setLastName(input){
    lastname = input;
}

async function submitForm(){
    try{
    const result = await fetch("http://localhost:3000/", {
        method: "POST",
        headers:{
            "Content-Type": "application/json",
        },
        body: JSON.stringify({firstname, lastname})
    });
    const parsed = await result.json();
    return parsed;
} catch(error){
    if(error instanceof Error){
        console.log(error); 
    }
}
}

function displayFormResponse(data){
    console.log(data);
    responseContent.appendChild(firstNameResponse);
    responseContent.appendChild(lastNameResponse);
    firstNameResponse.innerText = data.firstname;
    lastNameResponse.innerText = data.lastname;
}
