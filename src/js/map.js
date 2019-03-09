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
    let [x, y] = event.get('coords');

    // это нам понадобится для выведения адреса в попап
    getClickLocation([x, y]).then(address => console.log(address))

    // let placemark = new ymaps.Placemark([x, y]);
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