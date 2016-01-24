
var loc = "";
var api_key = 'f417bd1dfda811597b5c71a5b08536943d927648';
var crimes = [];
var found = false;

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "getSource") {
    var s = request.source;
    message.innerText = "Current Location: " + s + ", Philadelphia, PA";
    loc = s;
  }

  $(document).ready(function(){
      var str = "";

      // TEMPORARY VARIABLE
      // var location = "Northern Liberties, Philadelphia, PA";
      
      var location = loc + ", Philadelphia, PA";

      console.log(location);

      // get bike share info
      $.getJSON('https://www.rideindego.com/stations/json/', function(data) {
          var arr = [];
          var destinations = "";
          var arr = [];
          var len = data.features.length;

          for (var i = 0; i < len; i++) {
              
              var lat = data.features[i].geometry.coordinates[1];
              var lng = data.features[i].geometry.coordinates[0];

              // set up array of entries
              arr.push({
                  addressStreet: data.features[i].properties.addressStreet,
                  addressCity: data.features[i].properties.addressCity,
                  addressState: data.features[i].properties.addressState,
                  bikesAvailable: data.features[i].properties.bikesAvailable,
                  docksAvailable: data.features[i].properties.docksAvailable,
                  distance: 0.0
              });

              // create string for url of all lat/lng
              destinations = destinations + '|' + lat + ',' + lng;

          }

          destinations = destinations.slice(1, destinations.length);
          var url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + location + "&destinations=" + destinations + "&key=AIzaSyDDftUZtLLrANuNP2NRM3Jj3tge55P14n0";
          
          // get distances from location to each bike point
          $.getJSON(url, function(dist) {
              len2 = dist.rows[0].elements.length;
              for (var k = 0; k < len2; k++) {
                  arr[k].distance = dist.rows[0].elements[k].distance.text;
              }

              // sort the distances
              arr.sort(function(a, b){
                  var keyA = a.distance;
                  var keyB = b.distance;

                  // Compare the 2 params
                  if(keyA < keyB) return -1;
                  if(keyA > keyB) return 1;
                  return 0;
              });

              // console.log(arr);

              // add top 5 locations to a string to put in html
              for (var i = 0; i < 5; i++) {
                  str +="<li>" + arr[i].addressStreet + ", " + arr[i].addressState + ", " + arr[i].distance+ "</li>";
              }


              if (str == "") {
                  str +="<li>No results found!</li>";
              }

              //enable button
              $("#stations-button").click(function(){
                  $("#station-list").html(str);
                  $("#station-list").toggle();
              });


          });
          
      });
      
      // geocode the location
      geocodeURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&key=AIzaSyDDftUZtLLrANuNP2NRM3Jj3tge55P14n0";
      $.getJSON(geocodeURL, function(geocode) {
          var lat = geocode.results[0].geometry.location.lat;
          var lng = geocode.results[0].geometry.location.lng;
          
          // get and display nearby food places
          transitURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lng + "&radius=500&types=subway_station|train_station&key=AIzaSyDDftUZtLLrANuNP2NRM3Jj3tge55P14n0";
          console.log(transitURL);
          $.getJSON(transitURL, function(tran) {
              var str = "";

              for (var i = 0; i < tran.results.length; i++) {
                  str +="<li>" + tran.results[i].name + "</li>";
              }

              if (str == "") {
                  str +="<li>No results found!</li>";
              }


              $("#transport-button").click(function(){
                  $("#transport-list").html(str);
                  $("#transport-list").toggle();
              });

          });

                    // get and display nearby food places
          foodURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lng + "&radius=500&types=food&key=AIzaSyDDftUZtLLrANuNP2NRM3Jj3tge55P14n0";
          // console.log(foodURL);
          $.getJSON(foodURL, function(food) {
              var str = "";

              for (var i = 0; i < food.results.length; i++) {
                  str +="<li>" + food.results[i].name + "</li>";
              }

              if (str == "") {
                  str +="<li>No results found!</li>";
              }

              $("#food-button").click(function(){
                  $("#food-list").html(str);
                  $("#food-list").toggle();
              });

          });

          // get and display nearby attr places
          attrURL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lng + "&radius=500&types=amusement_park|aquarium|art_gallery|atm|movie_theater|museum|shopping_mall|subway_station|train_station&key=AIzaSyDDftUZtLLrANuNP2NRM3Jj3tge55P14n0";
          // console.log(attrURL);
          $.getJSON(attrURL, function(attr) {
              var str = "";

              for (var i = 0; i < attr.results.length; i++) {
                  // console.log(attr.results[i].photos);
                  str +="<li>" + attr.results[i].name + "</li>";
              }

              if (str == "") {
                  str +="<li>No results found!</li>";
              }

              $("#attr-button").click(function(){
                  $("#attr-list").html(str);
                  $("#attr-list").toggle();
              });
          });
      });

      var pattern = " ";
      var slug = loc.toLowerCase().replace(/ /g, "-");
      console.log(slug);
      $.getJSON('https://api.everyblock.com/content/philly/locations/' + slug + '/timeline/.json?schema=crime&token=' + api_key, function (events) {
        $.each(events.results, function (j, event_val) {
            found = false;
            for (var i = 0; i < crimes.length; i++) {
                if (crimes[i].title === event_val.title) {
                    crimes[i].number++;
                    found = true;
                    break;
                }
            }
            if (found === false) {
                crimes.push({title: event_val.title, number: 1});
            }
        });

        crimes.sort(function (a, b) {
            if (a.number < b.number) {
                return 1;
            }
            if (a.number > b.number) {
                return -1;
            }
            return 0;
        });

        crimes.forEach(function (entry) {
            var $event = $('<li>');
            $event.text(entry.title);
            $('.event_list').append($event);
        });
    });

    $('#events').click(function () {
        $(".event_list").toggle();
    });
  });

  


});

function onWindowLoad() {

  var message = document.querySelector('#message');

  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.runtime.lastError) {
      message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
    }
  });

}

window.onload = onWindowLoad;

