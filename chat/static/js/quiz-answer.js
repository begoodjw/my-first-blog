document.getElementById("action-title").innerHTML = "퀴즈 정답 관리"
var all_buttons = $('.example-button')
var example_buttons = [$('#example-button1'), $('#example-button2'), $('#example-button3'),
                $('#example-button4'), $('#example-button5'), $('#example-button6'),
                $('#example-button7'), $('#example-button8'), $('#example-button9'),
                $('#example-button10')];

all_buttons.hide();
all_buttons.click( function() {
    var exist_answer = document.querySelector('#quiz_answer').value;
    if( exist_answer.length > 0){
        document.querySelector('#quiz_answer').value = exist_answer + "|" + $(this).text();
    }else{
        document.querySelector('#quiz_answer').value = $(this).text();
    }

});

var roomName = document.getElementById("interactive-service-channel").textContent;
var service_id = "";

var chatSocket = new WebSocket(
    'wss://' + window.location.host +
    '/ws/chat/' + roomName + '/');

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

$('.table_row').click(function(){
    all_buttons.hide();
    var question = $(this).find('.question').text();
    var examples = $(this).find('.examples').text();
    service_id = $(this).find('.service_id').text();
    document.getElementById("question_value").innerHTML = question;

    example_split = examples.split("|");
    for(var i = 0; i < example_split.length; i++){
        example_buttons[i].html(example_split[i]);
        example_buttons[i].show();
    }


    //document.getElementById("example_value").innerHTML = examples;
})

document.querySelector('#service_submit').onclick = function(e) {
    if (service_id == "") {
        return ;
    }
    var quiz_answer = document.querySelector('#quiz_answer').value;
    if (quiz_answer.length == 0) {
        return ;
    }
    chatSocket.send(JSON.stringify({
        'category': 'tv',
        'owner': roomName,
        'service_id': service_id,
        'service_type': "quiz_answer",
        'answer': quiz_answer,
    }));
    location.reload(true);

};