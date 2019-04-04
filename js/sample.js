var saveClientInteractionHnd = (function(){
    
    var IP_ADDRESS = '0.0.0.0';
    var URL = window.location.origin + window.location.pathname;
    var RECORD_ACTION_API = 'http://localhost:8080/api/recordAction';
    var clientInfoObj = {};

    // $.getJSON('//ipapi.co/json/', function (data) {
        // IP_ADDRESS = data.ip;
        // clientInfoObj[IP_ADDRESS] = {};
        // clientInfoObj[IP_ADDRESS][URL] = [];
    // });
	
	//IP_ADDRESS = data.ip;
	clientInfoObj[IP_ADDRESS] = {};
	clientInfoObj[IP_ADDRESS][URL] = [];
        
    var saveClientInteraction = function (event) {
            /**
             * Strictly According to DB coloumn names:
             * URL, 
             * IP, 
             * User_Action_Type, 
             * User_Interaction_Time, 
             * Time
             */
            var interactionArr = [event.data.websiteId, IP_ADDRESS, event.data.actionType, event.type, Date.now() ];
            if(!$.isEmptyObject(clientInfoObj)){
                clientInfoObj[IP_ADDRESS][URL].push(interactionArr);
            }
    }
    
    var sendClientDataToServer = function(){
        if(clientInfoObj[IP_ADDRESS][URL].length !== 0){
            $.ajax({
                type: 'POST',
                data: { actionData : JSON.stringify(clientInfoObj[IP_ADDRESS][URL]) },
                url: RECORD_ACTION_API,						
                success: function(data) {
                    clientInfoObj[IP_ADDRESS][URL] = [];
                    console.log(data.message, data.insertId);
                },
                error: function(){
                    console.log('Error in recording user action!');
                }
            });
        }
    };

    setInterval(function(){
        sendClientDataToServer();
    }, 5000);

    return saveClientInteraction;
})();




$(document).on('click', '#testCan', { actionType: 'a', websiteId: '1' }, saveClientInteractionHnd);
$(document).on('click', '#addCircleText', { actionType: 'b', websiteId: '1' }, saveClientInteractionHnd);
$(document).on('click', '#addPathText', { actionType: 'c', websiteId: '1' }, saveClientInteractionHnd);
$(document).on('click', '#addAudio', { actionType: 'd', websiteId: '1' }, saveClientInteractionHnd);
