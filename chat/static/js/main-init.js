var action = document.getElementById("current-side-menu").textContent;;
  if (action == "home") {
    var element = document.getElementById("side-menu-home");
    element.classList.add("active");
  }else if (action == "create") {
    var element = document.getElementById("side-menu-create");
    element.classList.add("active");
  }else if (action == "history"){
    var element = document.getElementById("side-menu-history");
    element.classList.add("active");
  }else if (action == "quiz_answer"){
    var element = document.getElementById("side-menu-quiz-answer");
    element.classList.add("active");
  }else{
    console.log("action: " + action)
  }