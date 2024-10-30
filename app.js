//preloader
const preloader = document.querySelector(".preloader");
window.addEventListener("load", function () {
  preloader.classList.add("hidepreloader");
});
//load style button
const linkHover = document.querySelectorAll(".nav-btn");

linkHover.forEach(function (question) {
  const btn = question.querySelector(".hoverlink");
  // console.log(btn);

  btn.addEventListener("click", function () {
    linkHover.forEach(function (item) {
      if (item !== question) {
        item.classList.remove("active");
      } else {
        item.classList.add("active");
      }
    });
  });
});

//load style button
const linkHover1 = document.querySelectorAll(".nav-btn1");

linkHover1.forEach(function (question) {
  const btn1 = question.querySelector(".hoverlink1");
  // console.log(btn);

  btn1.addEventListener("click", function () {
    linkHover1.forEach(function (item) {
      if (item !== question) {
        item.classList.remove("active1");
      } else {
        item.classList.add("active1");
      }
    });
  });
});

//select section
let divs = ["section1", "section2", "section3", "section4"];
let visibleId = null;

function show(id) {
  if (visibleId !== id) {
    visibleId = id;
  }
  hide();
}

function hide() {
  let div, i, id;
  for (i = 0; i < divs.length; i++) {
    id = divs[i];
    div = document.getElementById(id);
    if (visibleId === id) {
      div.style.display = "block";
    } else {
      div.style.display = "none";
    }
  }
}

