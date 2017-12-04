if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    document.addEventListener("deviceready", onDeviceReady, false);
} else {
    onDeviceReady();
}


function onDeviceReady(){
    document.getElementById("console").innerHTML = "";
    
    
    //***** PARAMETERS *******
    // GLOBAL PARAMETERS
    
    //DEMO PURPOSE
    var partOfTheDay = 2;
    addConsoleMessage("new part of the day: "+partOfTheDay);
    
    //Data and Data Type Info
    // data type: 0 milage info; 1 steps info; 2 temperature; 3 icon weather; 4//DEMO PURPOSE Part of the day;
    // Example [dataType, J-x, dataValue]
    // Example [1,0,1234] = 1234 steps today
    // Example [1,2,124] = 124 steps 2 days ago
    
    // HEALTH KIT
    var numberOfPreviousDays = 10; //for steps count data
    
    //BLE
    timeBeforeRescan = 60;//secondes
    var picoProFound = 0;
    var picoProConnected =0;
    picoProId = ""; // Device ID = 26BB8695-343C-C300-0A2B-4AF8862412F0
    serviceUUID = "52B3CA23-6396-4DDC-BB67-9EB1FBBA28A7"; //service uuid
    uuid_read = "E0C8EC1E-40B3-4794-AA0B-936B83633219"; // caracteristics uuid read
    uuid_write = "59BD6D7a-09D1-45EC-BFEE-17344AD33116"; // caracteristics uuid write
    
    // TEMPERATURE
    var todayTemperature = 0;
    var indexLogoWeather = 0;
    var logoIndexCorrespondance = ['01d','01n','02d','02n','03d','03n','04d','04n','09d','09n','10d','10n','11d','11n','13d','13n','50d','50n'];
    
    
    
    //***** GLOBAL FUNCTIONS*****
    function onSuccess(result) {
        addConsoleMessage("Success: " + JSON.stringify(result));
        console.log("Success: " + JSON.stringify(result));
    };
    
    function onError(result) {
        addConsoleMessage("Error: " + JSON.stringify(result));
        console.log("Error: " + JSON.stringify(result));
    };
    
    function changePicoProStatus(stringMsg){
        document.getElementById("picopro_found").innerHTML = stringMsg;
    }
    
    function addConsoleMessage(stringMsg){
        document.getElementById("console").innerHTML += "<br>"+ "->  "+stringMsg;
    }
    
    function sendData(dataType,dataDay, dataValue){
        var data = intTo8BitArray(dataType,dataDay,dataValue);
        console.log(JSON.stringify(data));
        console.log(data);
        
        ble.write(picoProId,
                  serviceUUID,
                  uuid_write,data.buffer,
                  function(){console.log('success write: '+dataType+","+dataValue);
                  addConsoleMessage('success write: '+dataType+","+dataValue);
                  changePicoProStatus("Connected! Data sent");
                  },
                  function(){addConsoleMessage('failure write: '+dataType+","+dataValue);
                  })
    }
    
    // Reset function
    document.getElementById("reset").addEventListener("click", function(){onDeviceReady();}, false);
    
    
    
    //***** INITIALIZATION *******
    // BLE
    //--> app screen
    changePicoProStatus("Looking for the pico pro ...");
    addConsoleMessage("Looking for the pico pro ...");
    //--> scan
    ble.isEnabled(
                  function() {
                  console.log("Bluetooth is enabled");
                  },
                  function() {
                  console.log("Bluetooth is *not* enabled");
                  changePicoProStatus("Bluetooth is turned off, please turn it on and press reset.");
                  }
                  );
    
    function scanAndStopScan(){
        console.log("try to scan ...");
        ble.scan([], (timeBeforeRescan+1), function(device) {
                 bluetoothDeviceRecognized(device);
                 //console.log("new device found");
                 }, onError);
        setTimeout(function(){
                   if(picoProConnected==0){
                   ble.stopScan(function(msg){console.log("success Stop Scan");}, function(msg){console.log("failure Stop Scan");});
                   scanAndStopScan();
                   }
                   },timeBeforeRescan*1000);

    }
    scanAndStopScan();
    
    
    //--> If the pico pro is found --> we connect to it and send the data
    function bluetoothDeviceRecognized(device) {
        console.log(JSON.stringify(device));
        if (device.advertising.kCBAdvDataServiceUUIDs == (serviceUUID)){
            //ble.stopScan(function(msg){console.log("success Stop Scan");}, function(msg){console.log("failure Stop Scan");});
            picoProFound = 1;
            picoProId = device.id;
            console.log("picopro id: "+ picoProId);
            changePicoProStatus("PicoPro Found !");
            connectToPicoPro();
        }
    }
    
    
    // HEALTH KIT INITIALIZATION
    window.plugins.healthkit.available(
                                       function(isAvailable) {
                                       //alert(isAvailable ? "HealthKit available :)" : "No HealthKit on this device :(");
                                       console.log("isAvailable:"+ isAvailable);
                                       }
                                       );
    
    
    // HEALTH KIT TEST
    /*
    window.plugins.healthkit.readDateOfBirth(
                                             onSuccess, // yyyy-mm-dd ("1977-04-22")
                                             onError
                                             );
     */
    
    
    
    // ******* USE PLUGINS ****
    //DEMO PURPOSE : update part of the day
    function sendPartOfTheDay(){
        if (partOfTheDay<4){
            partOfTheDay +=1;
        } else{
            partOfTheDay =1;
        }
        console.log("new part of the day: "+partOfTheDay);
        addConsoleMessage("new part of the day: "+partOfTheDay);
        sendData(4,0,partOfTheDay);
    }
    
    // HEALTH KIT USE --- number of steps gathering
    function sendHealthData(){
        window.plugins.healthkit.querySampleTypeAggregated(
                                                           {
                                                           'startDate' : new Date(new Date().getTime()-numberOfPreviousDays*24*60*60*1000), // numberOfPreviousDays days ago
                                                           'endDate'   : new Date(), // now
                                                           'sampleType': 'HKQuantityTypeIdentifierStepCount',
                                                           'unit'      : 'count' // make sure this is compatible with the sampleType
                                                           },
                                                           onSuccessSteps,
                                                           onErrorSteps
                                                           );
        window.plugins.healthkit.querySampleTypeAggregated(
                                                           {
                                                           'startDate' : new Date(new Date().getTime()-numberOfPreviousDays*24*60*60*1000), // numberOfPreviousDays days ago
                                                           'endDate'   : new Date(), // now
                                                           'sampleType': 'HKQuantityTypeIdentifierDistanceWalkingRunning',
                                                           'unit'      : 'km' // make sure this is compatible with the sampleType
                                                           },
                                                           onSuccessKms,
                                                           onErrorKms
                                                           );
    }
    
    function onSuccessSteps(result) {
        //alert("Success Steps: " + JSON.stringify(result));
        console.log("Success Steps: " + JSON.stringify(result));
        for (var day=0;day<7;day++){
            sendData(1,day,Math.round(result[result.length-day-1].quantity));
        }
    };
    
    function onErrorSteps(result) {
        //alert("Error Steps: " + JSON.stringify(result));
        console.log("Error Steps: " + JSON.stringify(result));
    };
    
    function onSuccessKms(result) {
        //alert("Success Steps: " + JSON.stringify(result));
        //alert(JSON.stringify(result));
        console.log("Success Kms: " + JSON.stringify(result));
        for (var day=0;day<7;day++){
            sendData(0,day,Math.round(result[result.length-day-1].quantity*10));
        }
        
    };
    
    function onErrorKms(result) {
        //alert("Error Steps: " + JSON.stringify(result));
        console.log("Error Steps: " + JSON.stringify(result));
    };
    
    //DEMO PURPOSE
    document.getElementById("changePartOfTheDay").addEventListener("click", function(){sendPartOfTheDay();}, false);
    
    // BLE USE
    document.getElementById("connect").addEventListener("click", function(){connectToPicoPro();}, false);
    function connectToPicoPro(){
        if (picoProFound == 0) {
            //alert("The Pico Pro was not found yet, please wait...");
            changePicoProStatus("The Pico Pro was not found yet, please wait...");
        }
        else{
            ble.connect(picoProId,
                        function(msg){connectSuccess(msg);},
                        function(msg){connectError(msg);});
            //function(msg){alert("fail to connect "+ JSON.stringify(msg));});
        }
    }
    
    //converts an integer into an 8-bit array to communicate it to the PicoPro
    function intTo8BitArray(intType,intDay,intValue){
        var base8 = (intValue).toString(8);
        var base8Day = (intDay).toString(8);
        var base8Type = (intType).toString(8); // assume it's a single digit
        var lengthArray =base8.length;
        var eightBitArray = new Uint8Array(lengthArray+2);
        for (var i =2; i<lengthArray+2;i++){
            eightBitArray[i]= parseInt(base8[i-2],10);
        }
        eightBitArray[0]= parseInt(base8Type[0],10);
        eightBitArray[1]= parseInt(base8Day[0],10);
        return eightBitArray;
    }
    
    function connectSuccess(msg){
        console.log(msg);
        changePicoProStatus("Connected !")
        addConsoleMessage("Connected !");
        picoProConnected = 1;
        ble.stopScan(function(msg){console.log("success Stop Scan");}, function(msg){console.log("failure Stop Scan");});
        
        //TIME
        /*
        var d = new Date();
        var dataToWrite = d.getHours()*3600+d.getMinutes()*60+d.getSeconds();
        var dataTypeToWrite = 4;
        alert(d.getHours()+":"+d.getMinutes()+":"+d.getSeconds());
        alert(d.getHours()*3600+d.getMinutes()*60+d.getSeconds());
        var data = intTo8BitArray(dataTypeToWrite,dataToWrite);
        console.log(JSON.stringify(data));
        console.log(data);
        
        ble.write(picoProId,
                  serviceUUID,
                  uuid_write,data.buffer,
                  function(){console.log('success write');},
                  function(){alert('failure write');
                  })
         */
        
        sendHealthData();
        sendWeatherData();
    
        
        /*
        console.log("Reading...");
        ble.read(picoProId,
                 serviceUUID,
                 uuid_read,
                 function(msg){alert('success read '  +JSON.stringify(msg));},
                 function(msg){alert('failure read '+msg);})
        */
    }
    
    function connectError(msg){
        picoProConnected = 0;
        picoProFound = 0;
        //alert("connect error: "+JSON.stringify(msg));
        console.log(msg);
        console.log("Trying again to connect...");
        changePicoProStatus("Connection lost ! ");
        addConsoleMessage("Connection lost!");
        scanAndStopScan();
    }
    
    // WEATHER PLUGIN USE
    document.getElementById("getPosition").addEventListener("click", sendWeatherData);
    
    function sendWeatherData() {
        var options = {
        enableHighAccuracy: true,
        maximumAge: 3600000
        }
        var watchID = navigator.geolocation.getCurrentPosition(onSuccessPosition, onErrorPosition, options);
        
        function onSuccessPosition(position) {
           /* alert('Latitude: '          + position.coords.latitude          + '\n' +
                  'Longitude: '         + position.coords.longitude         + '\n' +
                  'Altitude: '          + position.coords.altitude          + '\n' +
                  'Accuracy: '          + position.coords.accuracy          + '\n' +
                  'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
                  'Heading: '           + position.coords.heading           + '\n' +
                  'Speed: '             + position.coords.speed             + '\n' +
                  'Timestamp: '         + position.timestamp                + '\n');*/
            
            Latitude = position.coords.latitude;
            Longitude = position.coords.longitude;
            getWeather(Latitude, Longitude);
        };
        
        function onErrorPosition(error) {
            addConsoleMessage('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
        }
    }
    // Success callback for get geo coordinates
    // Get weather by using coordinates
    
    function getWeather(latitude, longitude) {
        // Get a free key at http://openweathermap.org/. Replace the "Your_Key_Here" string with that key.
        var OpenWeatherAppKey = "bb0acfb382976a64e17c355f4a75a796";
        var queryString ='http://api.openweathermap.org/data/2.5/weather?lat='+ latitude + '&lon=' + longitude + '&appid=' + OpenWeatherAppKey + '&units=metric';
        $.getJSON(queryString, function (results) {
                  if (results.weather.length) {
                  $.getJSON(queryString, function (results) {
                            if (results.weather.length) {
                            //alert(JSON.stringify(results));
                            
                            if (results.main.temp){
                                todayTemperature = Math.round(results.main.temp);
                            console.log("todayTemperature:"+ todayTemperature);
                                sendData(2,0,todayTemperature);
                            }
                            if (results.weather){
                                var logoWeatherString = results.weather[0].icon;
                                indexLogoWeather = logoIndexCorrespondance.indexOf(logoWeatherString);
                                sendData(3,0,indexLogoWeather);
                            }
                            
                            
                            }
                            
                            });
                  }
                  }).fail(function () {
                          console.log("error getting location");
                          });
    }
    
    // Error callback
    function onWeatherError(error) {
        console.log('code: ' + error.code + '\n' +
                    'message: ' + error.message + '\n');
    }
    
    
    
    
}
