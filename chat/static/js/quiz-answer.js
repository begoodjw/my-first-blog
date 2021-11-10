document.getElementById("action-title").innerHTML = "퀴즈 정답 관리"

var progress_bar = $('.progress');
progress_bar.hide();

//var reserve_config = $('.reservation_config');
//reserve_config.hide();

var answer_process_type = "now"
var detail_type;
var single_type = "normal"

var answer_length = ""
var select_count = "1"
var quiz_attr_text;
var process_type;
var process_datetime;
var is_reserve_possible = false;



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

var quiz_data = {};
var roomName = document.getElementById("interactive-service-channel").textContent;
var service_id = "";

var chatSocket = new WebSocket(
    'wss://' + window.location.host +
    '/ws/chat/' + roomName + '/');

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};

$('.table_row').click(function(){
    quiz_attr_text = ""
    answer_length = ""
    all_buttons.hide();
    detail_type = $(this).find('.detail_type').text();
    var question = $(this).find('.question').text();
    var examples = $(this).find('.examples').text();
    service_id = $(this).find('.service_id').text();
    document.getElementById("question_value").innerHTML = question;

    var quiz_attr = $(this).find('.quiz-attr').text();
    var quiz_attr_data = JSON.parse(quiz_attr);

    if(!value_empty_check(quiz_attr_data)){
        if (quiz_attr_data["select_count"] !== undefined) {
            select_count = quiz_attr_data["select_count"]
            add_answer_attr("사용자 입력수 " + select_count);
        }
        if (detail_type == "객관식") {
            example_split = examples.split("|");
            for(var i = 0; i < example_split.length; i++){
                example_buttons[i].html(example_split[i]);
                example_buttons[i].show();
            }
            document.getElementById("quiz-example-group").style.display="block";

        }else {
            select_count = "1"
            add_answer_attr("사용자 입력수 " + select_count);
            if (quiz_attr_data["answer_length"] !== undefined) {
                answer_length = quiz_attr_data["answer_length"]
                add_answer_attr("정답 글자수 " + answer_length);
            }
        }
    }


    if (quiz_attr_text == ""){
        document.getElementById("answer-attr").style.display="none";
    }else {
        document.getElementById("answer-attr").style.display="block";
    }
    document.querySelector('#quiz_answer').value = "";





    if ($(this).hasClass('reserve_possible')){
        process_type = $(this).find('.process_type').text();
        process_datetime = $(this).find('.process_datetime').text();
        add_answer_attr(process_type + " 서비스")
        is_reserve_possible = true;
        set_reserve_possible_service();
    }else{
        process_type = ""
        process_datetime = ""
        is_reserve_possible = false;
        set_normal_service();
    }
    set_date_attr();

    document.getElementById('answer-attr').innerHTML = quiz_attr_text;

    $('#quiz_answer').removeClass("is-invalid")

    $('html, body').animate({ scrollTop: 0 }, 'fast');

    //document.getElementById("example_value").innerHTML = examples;
})

function add_answer_attr(text){
    if (quiz_attr_text == ""){
        quiz_attr_text = text
    }else{
        quiz_attr_text += ",\xa0\xa0\xa0" + text
    }
}

document.querySelector('#answer-submit').onclick = function(e) {
    if (service_id == "") {
        toast_message(TOAST_ERROR, "리스트에서 퀴즈 선택 필수");
        return ;
    }
    var quiz_answer = document.querySelector('#quiz_answer').value;
    if (quiz_answer.length == 0) {
        $('#quiz_answer').addClass("is-invalid")
        toast_message(TOAST_ERROR, "필수 입력값 확인");
        return ;
    }else{
        if (detail_type == "객관식"){
            if(answer_duplicate_error_check()){
                $('#quiz_answer').addClass("is-invalid")
                return ;
            }

            if (answer_count_error_check()){
                $('#quiz_answer').addClass("is-invalid")
                return ;
            }
        }else if (detail_type == "주관식"){
            if (answer_length != ""){
                if (answer_length_error_check()){
                    $('#quiz_answer').addClass("is-invalid")
                    return ;
                }
            }
        }

        $('#quiz_answer').removeClass("is-invalid")
    }

    quiz_data = {
        'category': 'tv',
        'owner': roomName,
        'channel_name': roomName,
        'service_id': service_id,
        'request_type': "quiz_answer",
        'service_type': "quiz",
        'answer': quiz_answer,
    }


    process_info = {}
    var process_radios = document.getElementsByName('process_radio');
    for(var i = 0; i < process_radios.length; i++){
        if(process_radios[i].checked){
            answer_process_type = process_radios[i].value;

            if (answer_process_type == "reserve"){
                quiz_data['answer_request_type'] = "reserve"
                var is_valid_detail = true;
                var date = $('#process_date').val();
                var time = $('#process_time').val();
                if (value_empty_check(date)){
                    is_valid_detail = false;
                    toast_message(TOAST_ERROR, "날짜 입력 필수");
                }

                if (value_empty_check(time)){
                    is_valid_detail = false;
                    toast_message(TOAST_ERROR, "시간 입력 필수");
                }

                if (is_valid_detail){
                    if(time_old_check(date, time)){
                        is_valid_detail = false;
                        toast_message(TOAST_ERROR, "적절하지 않은 날짜 및 시간 입력");
                    }else{
                        if (is_reserve_possible){
                            if(!time_proper_check_for_reserve_possible(date, time)){
                                is_valid_detail = false;
                                toast_message(TOAST_ERROR, "적절하지 않은 날짜 및 시간 입력");
                            }
                        }
                    }
                }

                if (!is_valid_detail){
                    return;
                }

                process_info = {"type": answer_process_type, "date": date, "time": time};
            }else{
                quiz_data['answer_request_type'] = "submit"
            }
        }
    }

    quiz_data['quiz_answer_process_info'] =  process_info

    document.getElementById("answer-submit").disabled = true;
    $(".container-fluid").css("opacity", 0.3)

    chatSocket.send(JSON.stringify(quiz_data));

    /*chatSocket.send(JSON.stringify({
        'category': 'tv',
        'owner': roomName,
        'service_id': service_id,
        'service_type': "quiz_answer",
        'answer': quiz_answer,
    }));*/

    $(function() {
      var current_progress = 0;
      progress_bar.show()
      var interval = setInterval(function() {
          current_progress += 50;
          $("#dynamic")
          .css("width", current_progress + "%")
          .attr("aria-valuenow", current_progress)
          .text(current_progress + "% Complete");
          if (current_progress >= 100)
              clearInterval(interval);
      }, 1000);
    });
    setTimeout(function(){ location.reload(true); }, 2500);

    //location.reload(true);

};


function processTimeRadioClick(myRadio) {
    if (myRadio.value  == 'now'){
        //reserve_config.hide();
        document.querySelector(".reservation_config").style.display="none";
        if (is_reserve_possible){
            setTimeout(function(){ set_reserve_possible_service(); }, 250);

        }


    }else if (myRadio.value == 'reserve') {
        document.querySelector(".reservation_config").style.display="block";
        //reserve_config.show();
    }
}

function value_empty_check(value){
    if( value == "" || value == null || value == undefined || ( value != null && typeof value == "object" && !Object.keys(value).length ) ){
        return true;
    }else{
        return false;
    }
}

function answer_length_error_check(){
    var answer_input = document.querySelector('#quiz_answer').value;
    var answer_list = answer_input.split("|");
    var answer_length_int = parseInt(answer_length);

    for(var j=0; j < answer_list.length; j++){
        var answer = answer_list[j];
        answer = answer.trim();

        if (!isNaN(answer_length_int)){
            if (answer.length !== answer_length_int){
                toast_message(TOAST_ERROR, "정답 글자수:\xa0\xa0\xa0" + answer_length)
                return true;
            }
        }
    }

    /*if (!isNaN(answer_length_int)){
        if (answer_input.length !== answer_length_int){
            toast_message(TOAST_ERROR, "정답 글자수:\xa0\xa0\xa0" + answer_length)
            return true;
        }
    }*/
    return false;
}

function answer_duplicate_error_check(){
    var answer_input = document.querySelector('#quiz_answer').value;
    var answer_list = answer_input.split("|");
    var answer_count = answer_list.length;

    for(var i=0; i < answer_count; i++){
        for(var j=0; j < answer_count; j++){
            if ( i == j ){
                continue;
            }
            if (answer_list[i] == answer_list[j]){
                toast_message(TOAST_ERROR, "정답에 중복된 값 존재")
                return true;
            }

        }
    }
    return false;
}

function answer_count_error_check(){
    var select_count_int = parseInt(select_count);
    var answer_input = document.querySelector('#quiz_answer').value;
    var answer_list = answer_input.split("|");
    var answer_count = answer_list.length;

    console.log(select_count + " " + answer_count.toString())
    if (answer_count < select_count_int){
        toast_message(TOAST_ERROR, "정답 개수가 사용자 입력 수 보다 적음");
        return true;
    }

    return false;
}

function set_reserve_possible_service(){
    document.getElementById("radio_reserve").checked = true;
    document.querySelector(".reservation_config").style.display="block";
    //reserve_config.show();
    toast_message(TOAST_WARNING, "퀴즈 수행전, 예약 수행만 가능")
}

function set_normal_service(){
    document.getElementById("radio_now").checked = true;
    document.querySelector(".reservation_config").style.display="none";
    //reserve_config.hide();
}


function time_old_check(date, time){
    var today = new Date();
    var cur_date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var cur_time = today.getHours() + ":" + today.getMinutes();

    var cur_datetime = cur_date.replaceAll("-", "") + cur_time.replaceAll(":", "");
    var datetime = date.replaceAll("-", "") + time.replaceAll(":", "");

    if (parseInt(datetime) <= parseInt(cur_datetime)){
        // error case
        return true;
    }else{
        return false;
    }
}

function set_date_attr(){
    if (process_type == "예약 수행"){
        var service_date = process_datetime.split(" / ")[0];
        var service_time = process_datetime.split(" / ")[1];
        console.log(service_date + " " + service_time)

        document.querySelector('#date-attr').innerHTML = service_date + "\xa0\xa0\xa0" + service_time + " 이후 시간 입력";
        document.querySelector("#date-attr").style.display="inline";
    }else if (process_type == "반복 수행"){

        var service_weekday = process_datetime.split(" / ")[0];
        var service_time = process_datetime.split(" / ")[1];
        var service_date_obj = getNextDay(service_weekday);
        var service_date = service_date_obj.getFullYear()+'-'+(service_date_obj.getMonth()+1)+'-'+service_date_obj.getDate();
        console.log("next service date: " + service_date + " " + service_time)

        document.querySelector('#date-attr').innerHTML = service_date + "\xa0\xa0\xa0" + service_time + " 이후 시간 입력";
        document.querySelector("#date-attr").style.display="inline";
    }else {
        document.querySelector('#date-attr').innerHTML = ""
        document.querySelector("#date-attr").style.display="none";

    }
}

function time_proper_check_for_reserve_possible(date, time){
    result = true;
    if (process_type == "예약 수행"){

        var service_date = process_datetime.split(" / ")[0];
        var service_time = process_datetime.split(" / ")[1];

        var datetime = date.replaceAll("-", "") + time.replaceAll(":", "");
        var service_datetime = service_date.replaceAll("-", "") + service_time.replaceAll(":", "");

        if (parseInt(datetime) <= parseInt(service_datetime)){
            result = false;
        }

    }else if (process_type == "반복 수행"){

        var service_weekday = process_datetime.split(" / ")[0];
        var service_time = process_datetime.split(" / ")[1];

        var service_date_obj = getNextDay(service_weekday);

        var datetime = date.replaceAll("-", "") + time.replaceAll(":", "");
        var service_date = service_date_obj.getFullYear()+'-'+(service_date_obj.getMonth()+1)+'-'+service_date_obj.getDate();

        if (parseInt(datetime) <= parseInt(service_datetime)){
            result = false;
        }
    }
    return result;
}


function getNextDay(day){

  var days = {
    '일': 0, '월': 1, '화': 2,
    '수': 3, '목': 4, '금': 5, '토': 6
  };

  var dayIndex = days[day.toLowerCase()];
  if (dayIndex === undefined) {
    throw new Error('"' + day + '" is not a valid input.');
  }

  var returnDate = new Date();
  var returnDay = returnDate.getDay();
  if (dayIndex !== returnDay) {
    returnDate.setDate(returnDate.getDate() + (dayIndex + (7 - returnDay)) % 7);
  }

  return returnDate;
}