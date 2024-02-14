let options = {
  rootMargin: "0px",
  threshold: 0.8,
};

let observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // если элемент появился
    if (entry.isIntersecting) {
      // добавить ему CSS-класс
      document.querySelector('.upButton').classList.add('_active')
    }
  });
}, options);

export function upButtonView(element){
  observer.unobserve(element)
}
