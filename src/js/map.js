ymaps.ready(init);
function init() {
  let map = new ymaps.Map("map", {
    center: [59.94, 30.32],
    zoom: 13,
    controls: ["searchControl"]
  },
    {
      suppressMapOpenBlock: true
    }
  );

  map.behaviors.disable(['dblClickZoom'])

  map.events.add('click', event => {
    let coords = event.get('coords');
    let input = document.querySelector(".map-input");
    getComputedStyle(input).display === "flex" ? input.style.display = "none" : input.style.display = "flex"
    // как найти координаты clientY clientX из этого эвента?
    console.log(event)

    // это нам понадобится для выведения адреса в попап
    getClickLocation(coords).then(address => console.log(address))

    // let placemark = new ymaps.Placemark(coords);
    // map.geoObjects.add(placemark);
  })
}

function getClickLocation(coords) {
  return new Promise((resolve, reject) => {
    ymaps.geocode([coords[0], coords[1]]).then(res => {
      let geoObject = res.geoObjects.get(0);
      let clickLocation = geoObject.getAddressLine();
      resolve(clickLocation)
    })
  })
}