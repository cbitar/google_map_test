console.log('linked!');

//AIzaSyCCSPeNs4RKje84chLxyLJKBdv_kf9gY7E

var los_angeles = {lat: 34.06, lng: -118.24};
//Way points array
var waypts = [];
//Initialize the marker coordiates
var currentMark = {lat: 34.08, lng: -118.14};
//Results back from yelp api
var searchBusinessResult = [];
var currentTrip = {};
//Current stop(marker) on click for storing stopId
var currentStopId = "";
//Current Activity on click on rest/shopping modal, for saving activitees id
var currentActivity = "";
//Current business type on click in act_style modal, for activities save
var currentBusType = "";
//All trips of the user
var allTrips = [];
//Current origin
var origin = "";
//Current destination
var destination = "";
//Represents all markers
var markers = [];
//Represents single markerId
var markerId = 0;

function initMap() {
  var autocomplete_orgin = new google.maps.places.Autocomplete(document.getElementById('origin'));
  var autocomplete_dest = new google.maps.places.Autocomplete(document.getElementById('dest'));
   directionsService = new google.maps.DirectionsService;
   directionsDisplay = new google.maps.DirectionsRenderer;
  //Array of marker object
  markers = [];
  //Array Id counter
  markerId = 0;
   map = new google.maps.Map(document.getElementById('map'), {
    zoom: 9,
    center: los_angeles,
    scrollwheel: false,
    styles: [
              {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
              {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
              {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
              {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{color: '#d59563'}]
              },
              {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{color: '#d59563'}]
              },
              {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{color: '#263c3f'}]
              },
              {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{color: '#6b9a76'}]
              },
              {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{color: '#38414e'}]
              },
              {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{color: '#212a37'}]
              },
              {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{color: '#9ca5b3'}]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{color: '#746855'}]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{color: '#1f2835'}]
              },
              {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{color: '#f3d19c'}]
              },
              {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{color: '#2f3948'}]
              },
              {
                featureType: 'transit.station',
                elementType: 'labels.text.fill',
                stylers: [{color: '#d59563'}]
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{color: '#17263c'}]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{color: '#515c6d'}]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{color: '#17263c'}]
              }
          ]
  });

  directionsDisplay.setMap(map);

  var onClickHandler = function() {
    calculateAndDisplayRoute(directionsService, directionsDisplay);
  };

  //Saving the trip on user
  $("#goBtn").on('click', function(event) {
    $.ajax({
    url: '/trips',
    dataType: 'json',
    method: "POST",
    data: {
      tripDate: $("#dt-picker").val(),
      origin: $("#origin").val(),
      destination: $("#dest").val()
      }
    })
    .done(function(data) {
      currentTrip = data;
    })
    origin = $("#origin").val();
    destination = $("#dest").val();
  });
  document.getElementById('goBtn').addEventListener('click', onClickHandler);

  //Define the drawing manager
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.MARKER,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ['marker']
    },
    markerOptions: {
      animation: google.maps.Animation.DROP
    }
  });
  //Initialize the drawing manager on map
  drawingManager.setMap(map);
  //Add listener to markers after drawn
  google.maps.event.addListener(drawingManager, 'markercomplete', function(marker) {
    //Sending post request to save stops on the current trip
    marker.uid = markerId;
    $.ajax({
        url: `/trips/${currentTrip._id}/stops`,
        dataType: 'json',
        method: "POST",
        data: {
          name: "stop1",
          location: {
            lat: marker.getPosition().lat(),
            lng: marker.getPosition().lng()
          }
        }
      })
      .done(function(data) {
        currentTrip = data;;
        myMarkerFunction(marker)
        markers.forEach(function(marker, i){
          marker.stopId = data.stops[i]._id;
        })
        currentStopId = data._id;
        console.log(markers);
      })
  });
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING',
    waypoints: waypts
  }, function(response, status) {
      console.log(response);
      $("#start_loc").text(response.routes[0].legs[0].start_address);
      $("#end_loc").text(response.routes[0].legs[0].end_address);
      $("#cell_duration").text(response.routes[0].legs[0].duration.text);
      $("#cell_milage").text(response.routes[0].legs[0].distance.text);
      if (status === 'OK') {
      directionsDisplay.setDirections(response);
      } else {
      window.alert('Directions request failed due to ' + status);
      }
    });
}

function myMarkerFunction(marker){
  //Assign id to the marker
    marker.uid = markerId;

    //Add listener to right click on marker
    google.maps.event.addListener(marker, 'rightclick', function(mouseEvent) {
      markToDelete = markers.filter(function(elm) {
        return elm.marker.uid == marker.uid;
      });
      //Remove stops in database
      $.ajax({
        url: `/stops/${markToDelete[0].stopId}`,
        dataType: 'json',
        method: "DELETE"
      })
      .done(function(data) {
        currentTrip = data;
      })
      //Remove marker object in marker array
      markers = markers.filter(function(elm){
        return elm.marker.uid != marker.uid
      })
      //Remove marker on map
      this.setMap(null);
      // console.log(marker);
      waypts = waypts.filter(function(elm){
        return elm.location.lat != marker.getPosition().lat()
      });
      // console.log(`Waypath after delete: ${waypts}`);
      calculateAndDisplayRoute(directionsService, directionsDisplay)
    });
    //Add listener to left click on marker
    google.maps.event.addListener(marker, 'click', function(mouseEvent) {
      currentMark = {
        lat: marker.getPosition().lat(),
        lng: marker.getPosition().lng()
      }
      console.log(currentMark);
      $('#activities_modal').modal('toggle');
      markToAddAct = markers.filter(function(elm) {
        return elm.marker.uid == marker.uid;
      });
    });
    //Push the marker object to markers array
    markers.push({
      id: markerId++,
      marker: marker,
      stopId: currentStopId
    });
    console.log(markers);
    console.log(`Latitude: ${marker.getPosition().lat()}, Longitude: ${marker.getPosition().lng()}`);
    console.log(marker.getPosition());
    waypts.push({
      location: {
        lat: marker.getPosition().lat(),
        lng: marker.getPosition().lng()
      },
      stopover: false
    });
    // console.log(`Waypath after add: ${waypts}`);
    calculateAndDisplayRoute(directionsService, directionsDisplay)
}

//Import the select2 Library for select bar
$(".js-example-basic-multiple").select2();

//Add Event Listener to pagenation buttons
$("li > a.page-numbers").on('click', function(event) {
  $("li > a.page-numbers").closest("li").removeClass('active');
  $("#previousBtn, #nextBtn").removeClass('disabled');
  $(this).closest("li").addClass('active');
  if ($(this).text() == '1(current)') {
    $("#previousBtn").addClass('disabled');
  }
  if ($(this).text() == '5(current)') {
    $("#nextBtn").addClass('disabled');
  }
});

//Function for searching business
function searchBusiness (term) {
  // console.log(term);
  // console.log($("#price_selection").val().join());
  $.ajax({
    url: '/yelp/search',
    dataType: 'json',
    data: {
      term: term,
      location: currentMark,
      price: $("#price_selection").val().join()
    }
  })
  .done(function(data) {
    searchBusinessResult = [];
    data.forEach(function(elm){
      searchBusinessResult.push(elm);
    });
    renderBusiness(1);
  })
}

//Function for rendering business depending on pagenation
function renderBusiness (pageNumb) {
  switch (pageNumb) {
    case 1:
      for (let i = 0; i < 5; i++) {
        $(`#media${i+1} > * img.img-flag`).attr('src', searchBusinessResult[i].img_url);
        $(`#media${i+1} > * h4`).text(searchBusinessResult[i].text);
        $(`#media${i+1} > * h3`).text(searchBusinessResult[i].id);
        $(`#media${i+1} > * td.select_address`).text(searchBusinessResult[i].address);
        $(`#media${i+1} > * td.select_price`).text(searchBusinessResult[i].price);
        renderRating(i+1, searchBusinessResult[i].rating)
      }
      break;
    case 2:
      for (let i = 0, j=5; i < 5; i++, j++) {
        $(`#media${i+1} > * img.img-flag`).attr('src', searchBusinessResult[j].img_url);
        $(`#media${i+1} > * h4`).text(searchBusinessResult[j].text);
        $(`#media${i+1} > * h3`).text(searchBusinessResult[j].id);
        $(`#media${i+1} > * td.select_address`).text(searchBusinessResult[j].address);
        $(`#media${i+1} > * td.select_price`).text(searchBusinessResult[j].price);
        renderRating(i+1, searchBusinessResult[j].rating)
      }
      break;
    case 3:
      for (let i = 0, j = 10; i < 5; i++, j++) {
        $(`#media${i+1} > * img.img-flag`).attr('src', searchBusinessResult[j].img_url);
        $(`#media${i+1} > * h4`).text(searchBusinessResult[j].text);
        $(`#media${i+1} > * h3`).text(searchBusinessResult[j].id);
        $(`#media${i+1} > * td.select_address`).text(searchBusinessResult[j].address);
        $(`#media${i+1} > * td.select_price`).text(searchBusinessResult[j].price);
        renderRating(i+1, searchBusinessResult[j].rating)
      }
      break;
    case 4:
      for (let i = 0, j = 15; i < 5; i++, j++) {
        $(`#media${i+1} > * img.img-flag`).attr('src', searchBusinessResult[j].img_url);
        $(`#media${i+1} > * h4`).text(searchBusinessResult[j].text);
        $(`#media${i+1} > * h3`).text(searchBusinessResult[j].id);
        $(`#media${i+1} > * td.select_address`).text(searchBusinessResult[j].address);
        $(`#media${i+1} > * td.select_price`).text(searchBusinessResult[j].price);
        renderRating(i+1, searchBusinessResult[j].rating)
      }
      break;
    case 5:
      for (let i = 0, j = 20; i < 5; i++, j++) {
        $(`#media${i+1} > * img.img-flag`).attr('src', searchBusinessResult[j].img_url);
        $(`#media${i+1} > * h4`).text(searchBusinessResult[j].text);
        $(`#media${i+1} > * h3`).text(searchBusinessResult[j].id);
        $(`#media${i+1} > * td.select_address`).text(searchBusinessResult[j].address);
        $(`#media${i+1} > * td.select_price`).text(searchBusinessResult[j].price);
        renderRating(i+1, searchBusinessResult[j].rating)
      }
    }
}

//Function for rendering rating
function renderRating (mediaNum, rating) {
  switch (rating) {
    case 1:
        $(`#media${mediaNum} > *img.select_rating_1`).attr("src", '/images/star_1.png');
        break;
    case 1.5:
        $(`#media${mediaNum} > *img.select_rating_1`).attr("src", '/images/star_1.png');
        $(`media${mediaNum} > *img.select_rating_2`).attr("src", '/images/star_1-5.png');
        $(`media${mediaNum} > *img.select_rating_3, media${mediaNum} > * img.select_rating_4， media${mediaNum} > * img.select_rating_5`).attr("src", '/images/star_0.png');
        break;
    case 2:
        $(`media${mediaNum} > *img.select_rating_1, media${mediaNum} > * img.select_rating_2`).attr("src", '/images/star_2.png');
        break;
    case 2.5:
        $(`media${mediaNum} > *img.select_rating_1, media${mediaNum} > * img.select_rating_2`).attr("src", '/images/star_2.png');
        $(`media${mediaNum} > *img.select_rating_3`).attr("src", '/images/star_2-5.png');
        $(`media${mediaNum} > * img.select_rating_4， media${mediaNum} > * img.select_rating_5`).attr("src", '/images/star_0.png');
        break;
    case 3:
        $(`media${mediaNum} > *img.select_rating_1, media${mediaNum} > * img.select_rating_2, media${mediaNum} > * img.select_rating_3`).attr("src", '/images/star_3.png');
        break;
    case 3.5:
        $(`media${mediaNum} > *img.select_rating_1, media${mediaNum} > * img.select_rating_2, media${mediaNum} > * img.select_rating_3`).attr("src", '/images/star_3.png');
        $(`media${mediaNum} > *img.select_rating_4`).attr("src", '/images/star_3-5.png');
        $(`media${mediaNum} > *img.select_rating_5`).attr("src", '/images/star_0.png');
        break;
    case 4:
        $(`#media${mediaNum} > * img.select_rating_1, #media${mediaNum} > * img.select_rating_2, #media${mediaNum} > * img.select_rating_3, #media${mediaNum} > * img.select_rating_4`).attr("src", '/images/star_4.png');
        $(`#media${mediaNum} > * img.select_rating_5`).attr("src", '/images/star_0.png');
        break;
    case 4.5:
        $(`#media${mediaNum} > * img.select_rating_1, #media${mediaNum} > * img.select_rating_2, #media${mediaNum} > * img.select_rating_3, #media${mediaNum} > * img.select_rating_4`).attr("src", '/images/star_4.png');
        $(`#media${mediaNum} > * img.select_rating_5`).attr("src", '/images/star_4-5.png');
        break;
    case 5:
        $(`#media${mediaNum} > * img.select_rating_1, #media${mediaNum} > * img.select_rating_2, #media${mediaNum} > * img.select_rating_3, #media${mediaNum} > * img.select_rating_4, #media${mediaNum} > * img.select_rating_5`).attr("src", '/images/star_5.png');
  }
}

//Function for toggleing restaurant modal
function reataurantToggle(){
  $('#restaurant_modal').modal('toggle')
  currentBusType = "restaurant";
}
//Function for toggleing shopping modal
function shoppingToggle(){
  $('#shopping_modal').modal('toggle')
  currentBusType = "shopping";
  debugger;
  searchBusiness('shopping')
}
//Function for toggleing recreation modal
function recreationToggle(){
  $('#recreation_modal').modal('toggle')
  currentBusType = "recreation";
}

//Function for toggleing confirm modal
function confirmToggle(event){
  $('#confirm_modal').modal('toggle')
  currentActivity = $(event).closest('div.media').find('h3').text();
}

//Function to execute when confirmed
function doAddAct(){
  $.ajax({
    url: `/stops/${markToAddAct[0].stopId}/activities`,
    dataType: 'json',
    method: "POST",
    data: {
      businessType: currentBusType,
      businessName: "business_name",
      businessId: currentActivity,
      lat: currentMark.lat,
      lng: currentMark.lng
    }
  })
  .done(function(data) {
    currentTrip = data;
    $('#confirm_modal').modal('hide');
    $('#restaurant_modal').modal('hide');
    $('#shopping_modal').modal('hide');
    $('#recreation_modal').modal('hide');
  })
}

function cancelConfirm(){
  $('#confirm_modal').modal('hide');
}

function getAllTrips(){
  $.ajax({
    url: '/trips',
    dataType: 'json'
  })
  .done(function(data) {
    allTrips = data;
  })
}

function renderOneTrip (tripId) {
  tripToRender = allTrips.filter(function(elm) {
    return elm._id == tripId
  })[0];
  currentTrip = tripToRender;
  origin = tripToRender.origin;
  destination = tripToRender.destination;
  waypts = tripToRender.stops.map(function(elem, index) {
    return {
            location: {
              lat: elem.location.lat,
              lng: elem.location.lng
            },
            stopover: false
          }
  });
  calculateAndDisplayRoute(directionsService, directionsDisplay);
  renderStops();
}

function renderStops(){
  currentTrip.stops.forEach(function(stop){
    var marker = new google.maps.Marker({
      position: stop.location,
      map: map,
      title: stop._id
    });
    myMarkerFunction(marker)
  });
}

function renderAllTrips(){
  $.ajax({
    url: '/trips',
    dataType: 'json'
  })
  .done(function(data) {
    allTrips = data;
    var html = '';
    var tBody = $("#trips-body");
    tBody.html('');
    allTrips.forEach(function(trip){
      html = `
        <tr>
          <td><a href="/trips/${trip._id}">${trip.origin} to ${trip.destination}</a></td>
          <td>${moment(trip.tripDate).format("MM-DD-YYYY")}</td>
          <td><a href="#restaurant_page" onclick="displayMapTrip('${trip._id}')"><img src="/images/icons/map-marker-32.png" alt=""></a></td>
          <td><a href="#" onclick="deleteTrip('${trip._id}')"><img src="/images/icons/x-mark-3-32.png" alt=""></a></td>
        </tr>
      `;
      tBody.append(html);
    });
  });
}

function deleteTrip(tripId) {
  $.ajax({
    url: '/trips/' + tripId,
    method: 'DELETE',
    dataType: 'json'
  })
  .done(function(data) {
    renderAllTrips();
  });
}

function displayMapTrip (tripId) {
  getAllTrips();
  renderOneTrip(tripId);
}
