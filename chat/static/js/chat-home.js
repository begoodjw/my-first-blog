$(document).ready(function () {
    const ACTIVE_STATE = 1;
    const INACTIVE_STATE = 0;
    const FINISH_STATE = 9;

    document.getElementById("action-title").innerHTML = "Dashboard"

    var chatSocket = new WebSocket(
        'ws://' + window.location.host +
        '/ws/chat/' + roomName +'Manager' + '/');

    chatSocket.onclose = function(e) {
        console.error('Chat socket closed unexpectedly');
    };

    $(".ActivateButton").click(function() {
        var $schedule_info = $(this).closest("tr")
                           .find(".schedule_info");
        var $service_id = $(this).closest("tr")
                           .find(".service_id");
        var $deactivate_button = $(this).closest("tr").find(".DeactivateButton");
        var $remove_button = $(".RemoveButton");


        if ($schedule_info.text()  == "일시정지"){
            $schedule_info.html("변환중..");
            $schedule_info.css('color', 'gray');
            $deactivate_button.prop('disabled', true);
            $remove_button.prop('disabled', true);

            setTimeout(function(){
                $schedule_info.html("운영중");
                $schedule_info.css('color', 'green');
                $deactivate_button.prop('disabled', false);
                $remove_button.prop('disabled', false);
            }, 3000);

            chatSocket.send(JSON.stringify({
                'category': 'tv',
                'service_type': "update_schedule",
                'channel_name': roomName,
                'service_id': $service_id.text(),
                'state': ACTIVE_STATE, //active
            }));
        }
    });

    $(".DeactivateButton").click(function() {
        var $item = $(this).closest("tr")   // Finds the closest row <tr>
                           .find(".schedule_info");     // Gets a descendent with class="nr"
        var $service_id = $(this).closest("tr")
                           .find(".service_id");
        var $activate_button = $(this).closest("tr").find(".ActivateButton");
        var $remove_button = $(".RemoveButton");

        if ($item.text()  == "운영중"){
            $item.html("변환중..");
            $item.css('color', 'gray');
            $activate_button.prop('disabled', true);
            $remove_button.prop('disabled', true);

            setTimeout(function(){
                $item.html("일시정지");
                $item.css('color', 'red');
                $activate_button.prop('disabled', false);
                $remove_button.prop('disabled', false);
            }, 3000);

            chatSocket.send(JSON.stringify({
                'category': 'tv',
                'service_type': "update_schedule",
                'channel_name': roomName,
                'service_id': $service_id.text(),
                'state': INACTIVE_STATE, //active
            }));
        }
    });

    $(".RemoveButton").click(function() {
        var $item = $(this).closest("tr")   // Finds the closest row <tr>
                           .find(".schedule_info");     // Gets a descendent with class="nr"
        var $service_id = $(this).closest("tr")
                           .find(".service_id");
        var $activate_button = $(".ActivateButton");
        var $deactivate_button = $(".DeactivateButton");
        var $remove_button = $(".RemoveButton");

        if ($item.text()  == "운영중" || $item.text()  == "일시정지"){
            $item.html("삭제중..");
            $item.css('color', 'gray');
            $activate_button.prop('disabled', true);
            $deactivate_button.prop('disabled', true);
            $remove_button.prop('disabled', true);

            setTimeout(function(){
                $item.html("삭제");
                location.reload();
            }, 4000);

            chatSocket.send(JSON.stringify({
                'category': 'tv',
                'service_type': "update_schedule",
                'channel_name': roomName,
                'service_id': $service_id.text(),
                'state': FINISH_STATE, //active
            }));
        }
    });

});


window.onload = function(){
    console.log("onload called")
    $(".schedule_info").each(function(){
        if ( $(this).text() == "운영중" ){
            $(this).css('color', 'green');
        }else if ( $(this).text() == "일시정지" ){
            $(this).css('color', 'red');
        }
    });
}



