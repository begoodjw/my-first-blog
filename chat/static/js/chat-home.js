var roomName = document.getElementById("interactive-service-channel").textContent;
var chatSocket;
var category;

$(document).ready(function () {

    const ACTIVE_STATE = 1;
    const INACTIVE_STATE = 0;
    const FINISH_STATE = 9;

    category = 'tv'
    if (roomName == "ADMIN"){
        category = "menual"
    }

    document.getElementById("action-title").innerHTML = "Dashboard"

    chatSocket = new WebSocket(
        'wss://' + window.location.host +
        '/ws/chat/' + roomName +'Manager' + '/?channel=' + roomName);

    chatSocket.onmessage = function(e) {
        var obj = JSON.parse(e.data);
        if (obj["request_type"] == "get_user_count"){
            var user_count = obj["user_count"];
            if (isNaN(user_count)){
                toast_message(TOAST_ERROR, "이용자수 업데이트 실패");
            }else{

                document.getElementById("current-user-count").innerHTML = "<strong>" + user_count.toString() +"</strong>"
                toast_message(TOAST_MESSAGE, "이용자수 업데이트 완료");
            }


        }
    };

    chatSocket.onclose = function(e) {
        console.error('Chat socket closed unexpectedly');
    };

    $(".ActivateButton").click(function() {
        var schedule_target = $(this).closest("tr")
                           .find(".schedule_target");
        var $schedule_info = $(this).closest("tr")
                           .find(".schedule_info");
        var $service_id = $(this).closest("tr")
                           .find(".service_id");
        var $deactivate_button = $(this).closest("tr").find(".DeactivateButton");
        var $remove_button = $(".RemoveButton");


        if ($schedule_info.text()  == "일시정지" || $schedule_info.text()  == "종료"){
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
                'category': category,
                'request_type': "update_schedule",
                'owner': roomName,
                'schedule_target': get_schedule_target(schedule_target.text()),
                'service_id': $service_id.text(),
                'state': ACTIVE_STATE, //active
            }));
        }
    });

    $(".DeactivateButton").click(function() {
        var schedule_target = $(this).closest("tr")
                           .find(".schedule_target");
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
            category = 'tv'
            if (roomName == "ADMIN"){
                category = "menual"
            }
            chatSocket.send(JSON.stringify({
                'category': category,
                'request_type': "update_schedule",
                'owner': roomName,
                'schedule_target': get_schedule_target(schedule_target.text()),
                'service_id': $service_id.text(),
                'state': INACTIVE_STATE, //active
            }));
        }
    });

    $(".RemoveButton").click(function() {
        var schedule_target = $(this).closest("tr")
                           .find(".schedule_target");
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
            category = 'tv'
            if (roomName == "ADMIN"){
                category = "menual"
            }
            chatSocket.send(JSON.stringify({
                'category': category,
                'request_type': "update_schedule",
                'owner': roomName,
                'schedule_target': get_schedule_target(schedule_target.text()),
                'service_id': $service_id.text(),
                'state': FINISH_STATE, //active
            }));
        }
    });

});

function refreshUserCount(){
    chatSocket.send(JSON.stringify({
        'category': category,
        'request_type': "get_user_count",
        'owner': roomName,
    }));
}


function get_schedule_target(text){
    if (text == "서비스"){
        return "service"
    }else if(text == "퀴즈정답"){
        return "quiz_answer"
    }
}

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



