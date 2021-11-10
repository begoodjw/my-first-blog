document.getElementById("action-title").innerHTML = "서비스 제작"
var program_title;
var service_type;
var detail_type;
var service_title;
//var service_text1;
//var service_text2;
//var service_text3;
//var service_text4;
//var service_text5;
//var service_text6;
var process_type;
var process_info;
var countdown;
var owner;
var channel_name;
var category;
var chatSocket;

var current_step_num = 0;
const example_max_add_count = 6;
var example_add_count = 0;

/*const TOAST_MESSAGE = 0;
const TOAST_WARNING = 1;
const TOAST_ERROR = 2;*/

var send_data = {};
/*
category
owner
channel_name

program_title
service_type
detail_type
service_title
countdown

process_type
process_info
note

- for quiz
question
examples
answer_include: include / exclude
answer
select_count
single_quiz_type : normal / string-length
answer_length

-for image
info-image
info-link
describe
*/


var roomName = document.getElementById("interactive-service-channel").textContent;
console.log("room name: " + roomName);

if (roomName == "ADMIN") {
    $("#channel-form").show();
    document.getElementById("channel-form").style.display="block";
}else{
    $("#channel-form").hide();
    document.getElementById("channel_name").required = false;
}

/*var chatSocket = new WebSocket(
    'ws://' + window.location.host +
    '/ws/chat/' + roomName + '/');

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};*/


var progress_bar = $('.progress');
var reserve_config = $('.reservation_config');
var repeat_config = $('.repetition_config');
progress_bar.hide();
reserve_config.hide();
repeat_config.hide();

//var hidden_examples = [$('#multiple-example-input5'), $('#multiple-example-input6'), $('#multiple-example-input7'),
//                        $('#multiple-example-input8'),$('#multiple-example-input9'), $('#multiple-example-input10')];

var hidden_examples = [$('#example-input-group5'), $('#example-input-group6'), $('#example-input-group7'),
                        $('#example-input-group8'),$('#example-input-group9'), $('#example-input-group10')];

for(var i = 0; i < hidden_examples.length; i++){
    hidden_examples[i].hide();
}

var hidden_vote_examples = [$('#vote-example-input5'), $('#vote-example-input6'), $('#vote-example-input7'),
                        $('#vote-example-input8'),$('#vote-example-input9'), $('#vote-example-input10')];

for(var i = 0; i < hidden_vote_examples.length; i++){
    hidden_vote_examples[i].hide();
}

const service_obj = {'quiz': $('.service_quiz'), 'info': $('.service_info'), 'vote': $('.service_vote')};
service_obj['quiz'].hide();
service_obj['info'].hide();
service_obj['vote'].hide();

function processTimeRadioClick(myRadio) {
    if (myRadio.value  == 'now'){
        reserve_config.hide();
        repeat_config.hide();
    }else if (myRadio.value == 'reserve') {
        reserve_config.show();
        repeat_config.hide();
    }else {
        reserve_config.hide();
        repeat_config.show();
    }
}

function answerRadioClick(myRadio) {
    var answer_input_box = $("#answer-input-box")
    var answer_input = $("#answer-input")
    //var answer_delay_input = $("#answer-delay-input")
    if ( myRadio.value == 'include' ) {
        answer_input.prop('required',true);
        //answer_delay_input.prop('required',true);
        answer_input_box.show();
        enable_example_checkbox();
    } else {
        answer_input.prop('required',false);
        //answer_delay_input.prop('required',false);
        answer_input_box.hide();
        disable_example_checkbox();
    }
}

function singleQuizTypeClick(radio){

    if ( radio.value == "normal" ) {
        $("#string-length-input").prop('required', false);
        $("#string-length-box").hide();
    } else if(radio.value == "string-length") {
        $("#string-length-input").prop('required', true);
        $("#string-length-box").show();
    }else{

    }
}

function infoLinkRadioClick(myRadio) {
     if ( myRadio.value == 'include' ) {
        document.getElementById("info-link").required = true;
        document.getElementById("info-link").style.display="block";
     } else {
        document.getElementById("info-link").required = false;
        document.getElementById("info-link").style.display="none";
     }
}

document.querySelector('#add-quiz-example-button').onclick = function(e) {
    if (example_add_count < example_max_add_count){
        hidden_examples[example_add_count].show();
        example_add_count += 1;
    }
}
document.querySelector('#add-vote-example-button').onclick = function(e) {
    if (example_add_count < example_max_add_count){
        hidden_vote_examples[example_add_count].show();
        example_add_count += 1;
    }
}


$('.quiz_option').show();
$('.info_option').hide();
$('.vote_option').hide();

function serviceTypeChange() {
    var type = document.getElementById("service_type").value;
    if (type == 'quiz'){
        $('.quiz_option').show();
        $('.quiz_option')[0].selected = true;
        $('.info_option').hide();
        $('.vote_option').hide();
    } else if( type == 'info' ){
        $('.quiz_option').hide();
        $('.info_option').show();
        $('.info_option')[0].selected = true;
        $('.vote_option').hide();
    } else if (type == 'vote' ) {
        $('.quiz_option').hide();
        $('.info_option').hide();
        $('.vote_option').show();
        $('.vote_option')[0].selected = true;
    }
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#info-image')
                .attr('src', e.target.result)
                .width(300)
                    .height(300);
        };

        reader.readAsDataURL(input.files[0]);
    }
}

function init_layout(){

    $('.setup-content').hide();

    $('#preview-button').hide();

    $("#answer-input-box").hide();
    $("#answer-input").prop('required',false);

    $("#string-length-box").hide();
    $("#string-length-input").prop('required', false);



    $("#input-info-image").hide();
    disable_example_checkbox();

}


$(document).ready(function () {

    init_layout();
    send_data = {};

    var step1 = $('.step-1'), step2 = $('.step-2'), step3 = $('.step-3'), step4 = $('.step-4');
    var steps = [step1, step2, step3, step4];


    var all_next_buttons = $('.nextBtn');
    var all_prev_buttons = $('.prevBtn');

    var current_step =  steps[current_step_num];
    current_step.show();
    if(roomName == "ADMIN"){
        current_step.find('input:eq(0)').focus();
    }else{
        current_step.find('input:eq(1)').focus();
    }



    all_prev_buttons.click(function () {
        // Click Prev Button
        if (current_step_num >= 1){
            var current_step =  steps[current_step_num];
            var prev_step =  steps[current_step_num-1];
            var current_inputs = current_step.find("input[type='text'],input[type='url']");

            for (var i = 0; i < current_inputs.length; i++) {
                $(current_inputs[i]).removeClass("is-invalid")
            }

            current_step.hide();
            prev_step.show();
            current_step_num -= 1;
            if (current_step_num == 0){
                send_data = {};
            }
        }
        $('#preview-button').hide();

        hidePreview();

    });


    all_next_buttons.click(function () {
        // Click Next Button
        var current_step =  steps[current_step_num];
        var current_inputs = current_step.find("input[type='text'],input[type='url']");
        var is_valid = true;

        // valid check before go to next step
        for (var i = 0; i < current_inputs.length; i++) {
            if (!current_inputs[i].validity.valid) {
                if (is_valid){
                    is_valid = false;
                }
                $(current_inputs[i]).addClass("is-invalid")
            }else{
                $(current_inputs[i]).removeClass("is-invalid")
            }


        }
        if(!is_valid){
            toast_message(TOAST_ERROR, "필수 입력값 확인");
        }

        if (is_valid) {
            // process before go to next step
            // current step hide & next step show
            // increase step number + 1

            if (current_step_num == 0){
                // step-1 ---> step-2

                // store step-1 data
                program_title = document.querySelector('#program_title').value;
                service_type = document.querySelector('#service_type').value;
                detail_type = document.querySelector('#detail_type').value;


                send_data["program_title"] = program_title;
                send_data["service_type"] = service_type;
                send_data["detail_type"] = detail_type;

                // set service channel
                owner = roomName;
                send_data["owner"] = roomName;
                if(roomName == "ADMIN"){
                    channel_name = document.querySelector('#channel_name').value;
                    category = "menual";
                    send_data["category"] = "menual";

                }else{
                    channel_name = roomName;
                    category = "tv"
                    send_data["category"] = "tv";
                }
                send_data["channel_name"] = channel_name;

                // connect to service handler server
                chatSocket = new WebSocket(
                    'wss://' + window.location.host +
                    '/ws/chat/' + channel_name + '/');

                chatSocket.onclose = function(e) {
                    console.error('Chat socket closed unexpectedly');
                };

                // display the layout for service type only(quiz, info, vote)
                for(key in service_obj) {
                    if(key == service_type){
                        service_obj[key].show()
                    }else{
                        service_obj[key].hide()
                    }
                }

                // init the service layout
                if (service_type == 'quiz'){
                    init_quiz_service(detail_type);
                }else if (service_type == 'info'){
                    init_info_service();
                }else if (service_type == 'vote'){
                    init_vote_service();
                }
                //example_add_count = 0;

            }else if (current_step_num == 1) {
                // step-2 ---> step-3
                var is_valid_detail = true;
                service_title = document.querySelector('#title-input').value;
                send_data["service_title"] = service_title;
                if (service_type == 'quiz') {
                    var example_count = 0;
                    //service_text1 = document.querySelector('#question-input').value;
                    send_data["question"] = document.querySelector('#question-input').value;
                    if (detail_type == 'multi'){
                        // set examples
                        example_count = set_example_list_quiz();
                        if (example_count < 0){
                            is_valid_detail = false;
                            return ;
                        }
                        //
                        var result = set_duplicate_answer(example_count);
                        if (!result){
                            is_valid_detail = false;
                            console.log("Not Valid Duplication Answer");
                        }
                    }else{
                        var result = set_single_quiz_type()
                        if (!result){
                            // ERROR: answer and example not match
                            console.log("Not Valid Answer");
                            is_valid_detail = false;
                        }
                    }

                    // get countdown
                    var result = set_countdown();
                    if (!result){
                        // ERROR: answer and example not match
                        console.log("Not Valid CountDown");
                        is_valid_detail = false;
                    }

                    // check if answer include
                    var result = set_answer_quiz(detail_type)
                    if (!result){
                        // ERROR: answer and example not match
                        console.log("Not Valid Answer");
                        is_valid_detail = false;
                    }

                }else if (service_type == 'info'){
                    var is_valid_detail = true;
                    set_description_info();
                    var result = set_image_info();
                    if (!result){
                        is_valid_detail = false;
                    }
                    //service_text3 = document.querySelector('#info-link').value;
                    send_data["info-link"] = document.querySelector('#info-link').value;

                    if (!is_valid_detail){
                        return ;
                    }
                }else if (service_type == 'vote'){
                    //service_text1 = document.querySelector('#vote-question-input').value;
                    send_data["question"] = document.querySelector('#vote-question-input').value;
                    if (detail_type == 'multi'){
                        var examples = document.getElementsByName('vote-example');
                        var example_list = examples[0].value;
                        for(var i = 1; i < examples.length; i++){
                            if(examples[i].value && examples[i].value != '') {
                                example_list += '|';
                                example_list += examples[i].value;
                            }
                        }
                        //service_text2 = example_list;
                        send_data["examples"] = example_list;
                    }
                }

                if (!is_valid_detail){
                    console.log("Not Valid");
                    return ;
                }

            }else if (current_step_num == 2) {
                var is_valid_detail = true;
                var final_text1;
                var final_text2;
                var final_text3;
                var final_text4;
                $('#preview-button').show();
                $('#preview-button').removeAttr("hidden");

                document.getElementById("final_program_title").innerHTML = program_title;
                document.getElementById("final_service_type").innerHTML = get_service_type(service_type) + "\xa0\xa0\xa0/\xa0\xa0\xa0" + get_detail_type(detail_type);

                var process_radios = document.getElementsByName('process_radio');
                for(var i = 0; i < process_radios.length; i++){
                    if(process_radios[i].checked){
                        process_type = process_radios[i].value;
                        send_data["process_type"] = process_type;
                    }
                }

                document.getElementById("final_service_title").innerHTML = service_title;
                if (service_type == 'quiz') {
                    set_final_quiz_details(detail_type)
                }else if(service_type == 'vote') {
                    /*final_text1 = '  - 질문 : ' + service_text1;
                    final_text2 = '  - 보기 : ' + service_text2;
                    //final_text3 = service_text3;
                    //final_text4 = service_text4;
                    document.getElementById("final_service_text1").innerHTML = final_text1;
                    document.getElementById("final_service_text2").innerHTML = final_text2;*/
                }else{
                    set_final_info_details();
                }

                var process_state = "";

                if (process_type == "reserve"){
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

                    if (is_valid_detail && time_old_check(date, time)){
                        is_valid_detail = false;
                        toast_message(TOAST_ERROR, "적절하지 않은 날짜 및 시간 입력");
                    }


                    process_info = {"type": process_type, "date": date, "time": time};

                }else if(process_type == "repeat"){
                    var checkedValue = "";
                    var time = $('#process_time2').val();
                    var inputElements = document.getElementsByClassName('weekdayCheckbox');
                    for(var i=0; inputElements[i]; ++i){
                          if(inputElements[i].checked){
                               checkedValue += inputElements[i].value;
                          }
                    }
                    if (value_empty_check(checkedValue)){
                        is_valid_detail = false;
                        toast_message(TOAST_ERROR, "요일 선택 필수");
                    }

                    if (value_empty_check(time)){
                        is_valid_detail = false;
                        toast_message(TOAST_ERROR, "시간 입력 필수");
                    }
                    process_info = {"type": process_type, "weekdays": checkedValue, "time": time};

                }else{
                    process_info = {};
                }

                if (!is_valid_detail){
                    return ;
                }

                send_data["process_info"] = process_info;
                send_data["note"] = ""

                document.getElementById("final_process_type").innerHTML = get_process_type(process_type, process_info);
                document.getElementById("final_service_countdown").innerHTML = countdown + "초";
                //console.log(JSON.stringify(send_data))


            }

            var next_step =  steps[current_step_num+1];
            current_step.hide();
            next_step.show();
            next_step.find('input:eq(0)').focus();
            current_step_num += 1;

        }
    });

    $('div.setup-panel div a.btn-success').trigger('click');
    setDataTables();

});

function setDataTables(){
    var lang_kor = {
        "decimal" : "",
        "emptyTable" : "데이터가 없습니다.",
        "info" : "_START_ - _END_ (총 _TOTAL_ 명)",
        "infoEmpty" : "0명",
        "infoFiltered" : "(전체 _MAX_ 명 중 검색결과)",
        "infoPostFix" : "",
        "thousands" : ",",
        "lengthMenu" : "_MENU_ 개씩 보기",
        "loadingRecords" : "로딩중...",
        "processing" : "처리중...",
        "search" : "검색 : ",
        "zeroRecords" : "검색된 데이터가 없습니다.",
        "paginate" : {
            "first" : "첫 페이지",
            "last" : "마지막 페이지",
            "next" : "다음",
            "previous" : "이전"
        },
        "aria" : {
            "sortAscending" : " :  오름차순 정렬",
            "sortDescending" : " :  내림차순 정렬"
        }
    };
    $('#myTable').dataTable({
        language : lang_kor //or lang_eng
    });

}

function set_opaque_background(){
    $(".container-fluid").css("opacity", 0.3);
    $(".side-navbar").css("opacity", 0.3);
}

function unset_opaque_background(){
    $(".container-fluid").css("opacity", 1);
    $(".side-navbar").css("opacity", 1);
}

document.querySelector('#service_submit').onclick = function(e) {

    send_data["request_type"] = "service_create";
    document.getElementById("service_submit").disabled = true;
    hidePreview();
    set_opaque_background();
    chatSocket.send(JSON.stringify(send_data));

    /*chatSocket.send(JSON.stringify({
        'category': category,
        'owner': owner,
        'channel_name': channel_name,
        'program_title': program_title,
        'service_type': service_type,
        'detail_type': detail_type,
        'service_title': service_title,
        'countdown': countdown,
        'service_text1': service_text1,
        'service_text2': service_text2,
        'service_text3': service_text3,
        'service_text4': service_text4,
        'process_type': process_type,
        'process_info': process_info,
        'note': '',
    }));*/

    //setTimeout(function(){ location.reload(true); }, 1000);

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
    setTimeout(function(){ location.reload(true); }, 3000);

    /*var bar = new ProgressBar.Circle('#progressbar', {
      strokeWidth: 6,
      easing: 'easeInOut',
      duration: 1400,
      color: '#FFEA82',
      trailColor: '#eee',
      trailWidth: 1,
      svgStyle: null
    });

    bar.animate(1.0);  // Number from 0.0 to 1.0*/

    //location.reload(true);

};

function waitForSocketReady(socket, callback){
    setTimeout(
        function () {
            if (socket.readyState === 1) {
                console.log("Connection is made")
                if (callback != null){
                    callback();
                }
            } else {
                console.log("wait for ready state...")
                waitForSocketConnection(socket, callback);
            }

        }, 500); // wait 5 milisecond for the connection...
}

$('.btn-number').click(function(e){
    e.preventDefault();

    fieldName = $(this).attr('data-field');
    type      = $(this).attr('data-type');
    var input = $("input[name='"+fieldName+"']");
    var currentVal = parseInt(input.val());
    if (!isNaN(currentVal)) {
        if(type == 'minus') {

            if(currentVal > input.attr('min')) {
                input.val(currentVal - 1).change();
            }
            if(parseInt(input.val()) == input.attr('min')) {
                $(this).attr('disabled', true);
            }

        } else if(type == 'plus') {

            if(currentVal < input.attr('max')) {
                input.val(currentVal + 1).change();
            }
            if(parseInt(input.val()) == input.attr('max')) {
                $(this).attr('disabled', true);
            }

        }
    } else {
        input.val(0);
    }
});
$('.input-number').focusin(function(){
   $(this).data('oldValue', $(this).val());
});
$('.input-number').change(function() {

    minValue =  parseInt($(this).attr('min'));
    maxValue =  parseInt($(this).attr('max'));
    valueCurrent = parseInt($(this).val());

    name = $(this).attr('name');
    if(valueCurrent >= minValue) {
        $(".btn-number[data-type='minus'][data-field='"+name+"']").removeAttr('disabled')
    } else {
        alert('Sorry, the minimum value was reached');
        $(this).val($(this).data('oldValue'));
    }
    if(valueCurrent <= maxValue) {
        $(".btn-number[data-type='plus'][data-field='"+name+"']").removeAttr('disabled')
    } else {
        alert('Sorry, the maximum value was reached');
        $(this).val($(this).data('oldValue'));
    }

});

$(".input-number").keydown(function (e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 190]) !== -1 ||
             // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
             // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
                 // let it happen, don't do anything
                 return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

function get_service_type(service_value) {
    if (service_value == "quiz"){
        return "퀴즈";
    }else if (service_value == "info") {
        return "정보"
    }else if (service_value == "vote") {
        return "투표"
    }else {
        return "unknown"
    }
}

function get_detail_type(detail_value) {
    if (detail_value == "multi"){
        return "객관식";
    }else if (detail_value == "single") {
        return "주관식"
    }else if (detail_value == "product") {
        return "관련 정보"
    }else {
        return "unknown"
    }
}


function get_service_type_from_display(service_value) {
    if (service_value == "퀴즈"){
        return "quiz";
    }else if (service_value == "정보") {
        return "info"
    }else if (service_value == "투표") {
        return "vote"
    }else {
        return "unknown"
    }
}

function get_detail_type_from_display(detail_value) {
    if (detail_value == "객관식"){
        return "multi";
    }else if (detail_value == "주관식") {
        return "single"
    }else if (detail_value == "관련 정보") {
        return "product"
    }else {
        return "unknown"
    }
}

function get_process_type(process_value, process_info) {
    if (process_value == "now"){
        return "즉시 수행";
    }else if (process_value == "repeat") {
        return "반복 수행\xa0\xa0\xa0/\xa0\xa0\xa0" + process_info["weekdays"] + "\xa0\xa0\xa0/\xa0\xa0\xa0" + process_info["time"]
    }else if (process_value == "reserve") {
        return "예약 수행\xa0\xa0\xa0/\xa0\xa0\xa0" + process_info["date"] + "\xa0\xa0\xa0/\xa0\xa0\xa0" + process_info["time"]
    }else {
        return "unknown"
    }
}


function init_quiz_service(detail_type){
    if (detail_type != 'multi'){
        $('.quiz-examples').hide();
        $('#duplicate-input-form').hide();
        $('#single-quiz-type').show();
        single_quiz_radio_set();

        document.getElementById("multiple-example-input1").required = false;
        document.getElementById("multiple-example-input2").required = false;
    }else {
        $('.quiz-examples').show();
        $('#duplicate-input-form').show();
        $('#single-quiz-type').hide();
        single_quiz_radio_unset();
        document.getElementById("multiple-example-input1").required = true;
        document.getElementById("multiple-example-input2").required = true;
    }
    document.getElementById("question-input").required = true;

    answer_radio_set();

    // for info
    document.getElementById("service_describe").required = false;
    document.getElementById("info-link").required = false;

    // for vote
    document.getElementById("vote-question-input").required = false;
    document.getElementById("vote-example-input1").required = false;
    document.getElementById("vote-example-input2").required = false;

}

function init_info_service(){

    document.getElementById("service_describe").required = true;
    document.getElementById("info-link").required = true;
    single_quiz_radio_unset();

    // for quiz
    document.getElementById("question-input").required = false;
    document.getElementById("answer-input").required = false;
    //document.getElementById("answer-delay-input").required = false;
    document.getElementById("multiple-example-input1").required = false;
    document.getElementById("multiple-example-input2").required = false;

    //for vote
    document.getElementById("vote-question-input").required = false;
    document.getElementById("vote-example-input1").required = false;
    document.getElementById("vote-example-input2").required = false;
}

function init_vote_service(){
    if (detail_type != 'multi'){
        $('.vote-examples').hide();
        document.getElementById("vote-example-input1").required = false;
        document.getElementById("vote-example-input2").required = false;
    }else {
        $('.vote-examples').show();
        document.getElementById("vote-example-input1").required = true;
        document.getElementById("vote-example-input2").required = true;
    }
    document.getElementById("vote-question-input").required = true;
    single_quiz_radio_unset();

    // for quiz
    document.getElementById("question-input").required = false;
    document.getElementById("answer-input").required = false;
    //document.getElementById("answer-delay-input").required = false;
    document.getElementById("multiple-example-input1").required = false;
    document.getElementById("multiple-example-input2").required = false;

    // for info
    document.getElementById("service_describe").required = false;
    document.getElementById("info-link").required = false;
}

function value_empty_check(value){
    if( value == "" || value == null || value == undefined || ( value != null && typeof value == "object" && !Object.keys(value).length ) ){
        return true;
    }else{
        return false;
    }
}

function answer_radio_set() {
    var answer_input_box = $("#answer-input-box")
    var answer_input = $("#answer-input")
    if ( document.getElementById("answer-radio-exclude").checked ) {
        console.log("answer hide");
        answer_input.prop('required',false);
        answer_input_box.hide()
        disable_example_checkbox();

    } else {
        console.log("answer show");
        answer_input.prop('required',true);
        answer_input_box.show()
        enable_example_checkbox();
    }
    if (detail_type == "multi") {
        set_answer_checked()
    }
}

function single_quiz_radio_set() {
    var normal = document.getElementById("single-quiz-normal");
    var string_length = document.getElementById("single-quiz-string-length");

    if ( normal.checked ) {
        console.log("정답 길이 False");
        $("#string-length-input").prop('required', false);
        $("#string-length-box").hide();
    } else if(string_length.checked) {
        console.log("정답 길이 True");
        $("#string-length-input").prop('required', true);
        $("#string-length-box").show();
    }else{

    }
}

function single_quiz_radio_unset() {
    $("#string-length-input").prop('required', false);
}

// return the number of example
function set_example_list_quiz(){
    var example_array = [];
    var example_count = 0;
    var examples = document.getElementsByName('multiple-example');

    var example_list = examples[0].value;
    example_array.push(examples[0].value);
    example_count = 1;
    for(var i = 1; i < examples.length; i++){
        example_text = examples[i].value;
        example_text = example_text.trim();

        if(example_text.includes("|")){
            console.log("보기 중복: " + example_text)
            examples[i].classList.add("is-invalid");
            toast_message(TOAST_ERROR, "\"|\" 기호 사용 불가");
            return -1;
        }

        if(example_text && example_text != '') {
            if (example_array.includes(example_text)){
                console.log("보기 중복: " + example_text)
                examples[i].classList.add("is-invalid");
                toast_message(TOAST_ERROR, "보기에 중복된 값 존재");
                return -1;
            }
            example_list += '|';
            example_list += example_text;
            example_array.push(example_text);
            example_count += 1;
        }
    }
    //service_text2 = example_list;
    send_data["examples"] = example_list;
    return example_count;
}


// return countdown integer. if NaN, return -1
function set_countdown(){
    var is_valid = true;
    var countdown_value = document.querySelector('#countdown-input').value;
    var countdown_int = parseInt(countdown_value);
    if (value_empty_check(countdown_value)){
        countdown_int = 30;
        toast_message(TOAST_MESSAGE, "카운트다운 기본값인 30초로 셋팅");
    }
    else if (isNaN(countdown_int)){
        console.log("countdown is NaN");
        $('#countdown-input').addClass("is-invalid")
        toast_message(TOAST_ERROR, "카운트다운 숫자만 입력 가능");
        is_valid = false;
    }else{
        if (countdown_int < 10){
            countdown_int = 10;
            toast_message(TOAST_WARNING, "카운트다운 최소값인 10초로 셋팅");
        }else if (countdown_int > 60){
            countdown_int = 60;
            toast_message(TOAST_WARNING, "카운트다운 최대값인 60초로 셋팅");
        }
    }
    countdown = countdown_int.toString();
    send_data["countdown"] = countdown;
    return is_valid;
}

function set_single_quiz_type(single_type){
    var is_valid = true;
    var normal = document.getElementById("single-quiz-normal");
    var string_length = document.getElementById("single-quiz-string-length");

    if (normal.checked){
        console.log("normal checked")
        //service_text6 = single_type;
        send_data["single_quiz_type"] = "normal";
        return is_valid;
    }else if (string_length.checked){
        console.log("string_length checked");
        var string_length = document.querySelector('#string-length-input').value;
        var string_length_int = parseInt(string_length);

        if (isNaN(string_length_int)){
            //console.log("select_count value is not a number" + select_count);
            $('#string-length-input').addClass("is-invalid")
            toast_message(TOAST_ERROR, "글자수 숫자만 입력 가능");
            is_valid = false;
        }else{
            if(string_length_int > 10 || string_length_int < 1){
                $('#string-length-input').addClass("is-invalid")
                is_valid = false;
                toast_message(TOAST_ERROR, "글자수 1 ~ 10 범위 내에서 입력 ");
            }
        }
        send_data["single_quiz_type"] = "string-length";
        send_data["answer_length"] = string_length;
    }else{
        console.log("nothing checked");
    }

    return is_valid;
}

// return false if answer is not in the example list
function set_answer_quiz(detail_type){
    var is_valid = true;
    var answer_radios = document.getElementsByName('answer_radio');
    for(var i = 0; i < answer_radios.length; i++){
        if(answer_radios[i].checked){
            //service_text3 = answer_radios[i].value;
            send_data["answer_include"] = answer_radios[i].value;
        }

    }
    if (send_data["answer_include"] == 'include') {
        // get answer & answer delay time
        var answer_input = document.querySelector('#answer-input').value;
        var answer = answer_input.trim();
        if (detail_type == 'multi'){
            // check if answer is in examples
            if (!check_answer()){
                $('#answer-input').addClass("is-invalid")
                toast_message(TOAST_ERROR, "보기와 일치하지 않는 정답 존재");
                is_valid = false;
            }
        }else{
            if (send_data["single_quiz_type"] == "string-length"){
                if (answer_length_error_check()){
                    $('#answer-input').addClass("is-invalid")
                    is_valid = false;
                }
                /*
                var string_length = send_data["answer_length"];
                if (parseInt(string_length) != answer.length){
                    $('#answer-input').addClass("is-invalid")
                    toast_message(TOAST_ERROR, "정답 글자수: " + string_length);
                    is_valid = false;
                }*/
            }
        }
        //service_text4 = answer_input;
        send_data["answer"] = answer;
    }
    return is_valid;
}

function set_duplicate_answer(example_count){
    var is_valid = true;
    var select_count = document.querySelector('#duplicate-input').value;
    var select_count_int = parseInt(select_count);
    if (value_empty_check(select_count)){
        select_count = "1"
        toast_message(TOAST_MESSAGE, "정답 선택 수 1개로 셋팅");
    }
    else if (isNaN(select_count_int)){
        //console.log("select_count value is not a number" + select_count);
        $('#duplicate-input').addClass("is-invalid")
        toast_message(TOAST_ERROR, "정답 선택수 숫자만 입력 가능");
        is_valid = false;
    }else{
        if(select_count_int >= example_count || select_count_int < 1){
            $('#duplicate-input').addClass("is-invalid")
            is_valid = false;
            toast_message(TOAST_ERROR, "정답 선택수 보기 개수 이내에서 가능");
        }else{
            console.log("select_count value is " + select_count);
        }
    }
    if (is_valid){
        //service_text5 = select_count;
        send_data["select_count"] = select_count;
    }
    return is_valid;

}

function set_description_info(){
    var describe = document.querySelector('#service_describe').value;
    if(value_empty_check(describe)){
        // WARNING: description empty
        console.log("description empty");
        toast_message(TOAST_WARNING, "정보에 대한 설명 없음");
    }
    //service_text1 = describe;
    send_data["describe"] = describe;
}

function set_image_info(){
    var imgFile = $('#input-info-image').val();
    var maxSize = 2 * 1024 * 1024;
    var fileSize;

    if(imgFile == "") {
        console.log("첨부파일은 필수!");
        $("#info-image").focus();
        toast_message(TOAST_ERROR, "이미지 첨부 필수");
        return false;
    }

    if(imgFile != "" && imgFile != null) {
        fileSize = document.getElementById("input-info-image").files[0].size;

        if(fileSize >= maxSize) {
            console.log("파일 사이즈는 1MB까지 가능");
            toast_message(TOAST_ERROR, "이미지 사이즈 2MB까지 가능");
            return false;
        }
    }

    //service_text2 = document.querySelector('#info-image').src;
    send_data["info-image"] = document.querySelector('#info-image').src;

    return true;
}

function readUrl(input) {

  if (input.files && input.files[0]) {
    let reader = new FileReader();
    reader.onload = (e) => {
      let imgData = e.target.result;
      let imgName = input.files[0].name;
      input.setAttribute("data-title", imgName);
      console.log(e.target.result);
    }
    reader.readAsDataURL(input.files[0]);
  }

}

function set_final_quiz_details(detail_type){

    $("#service-quiz-details").show();
    $("#service-info-details").hide();
    $("#service-vote-details").hide();

    //var final_question = '질문 :\xa0\xa0\xa0\xa0\xa0' + service_text1;
    var final_question = '질문 :\xa0\xa0\xa0\xa0\xa0' + send_data["question"];
    document.getElementById("final-service-quiz-question").innerHTML = final_question;

    var final_answer;
    if (send_data["answer_include"] == 'include'){
        final_answer = '정답 :\xa0\xa0\xa0\xa0\xa0' + send_data["answer"];
    }else{
        final_answer = "정답 :\xa0\xa0\xa0\xa0\xa0*불포함";
    }
    document.getElementById("final-service-quiz-answer").innerHTML = final_answer;

    //var ul = document.getElementById("final-service-quiz-example-list");
    if (detail_type == 'multi'){
        var final_select = "정답 선택 개수 :\xa0\xa0\xa0\xa0\xa0" + send_data["select_count"] + "개";
        document.getElementById("final-service-quiz-select").innerHTML = final_select;

        var examples = document.getElementsByName('multiple-example');
        var example_text = "";
        for(var i = 0; i < examples.length; i++){
            if(examples[i].value && examples[i].value != '') {
                if (i != 0){
                    example_text += ",\xa0\xa0\xa0";
                }
                var example = examples[i].value;
                example = example.trim();
                example_text += example;
            }
        }
        document.getElementById("final-service-quiz-example").innerHTML = "보기 :\xa0\xa0\xa0\xa0\xa0" + example_text;
        $("#final-service-quiz-select").show();
        $("#final-service-quiz-example").show();
        $("#final-service-single-type").hide();

    }else{
        $("#final-service-quiz-select").hide();
        $("#final-service-quiz-example").hide();
        var single_type = send_data["single_quiz_type"];
        if (single_type == "string-length"){
            document.getElementById("final-service-single-type").innerHTML = "정답 글자 수 :\xa0\xa0\xa0\xa0\xa0" + send_data["answer_length"];
        }else{
            $("#final-service-single-type").hide();
        }
    }
}

function set_final_info_details(){
    $("#service-quiz-details").hide();
    $("#service-info-details").show();
    $("#service-vote-details").hide();

    //var final_description = service_text1.replace(/(?:\r\n|\r|\n)/g, '<br>');
    var describe = send_data["describe"];
    var final_description = describe.replace(/(?:\r\n|\r|\n)/g, '<br>');
    document.getElementById("final-service-info-desc").innerHTML = final_description;


    var final_image = document.getElementById("final-service-info-image");

    /*while (final_image.hasChildNodes()) {
      final_image.removeChild(final_image.firstChild);
    }*/

    final_image.setAttribute("height", "340");
    final_image.setAttribute("width", "340");
    //final_image.src = service_text2;
    final_image.src =send_data["info-image"];

    var final_link = document.getElementById("final-service-info-link");
    //final_link.setAttribute('href',service_text3);
    final_link.setAttribute('href',send_data["info-link"]);
    final_link.setAttribute('target', '_blank');

    countdown = "30";
    send_data["countdown"] = countdown;


}

/*function toast_message(type, text){
    var toast_container = document.getElementById("toast-container");
    var alert = document.createElement("div");

    alert.appendChild(document.createTextNode(text));
    alert.classList.add("alert");
    if (type == TOAST_MESSAGE) {
        alert.classList.add("alert-success");
    }else if (type == TOAST_WARNING){
        alert.classList.add("alert-warning");
    }else if (type == TOAST_ERROR){
        alert.classList.add("alert-danger");
    }else{
        return ;
    }

    var rand_id = make_random_string(10);
    alert.setAttribute("id", rand_id);

    toast_container.appendChild(alert);
    setTimeout(function() {
        var id = "#" + rand_id;
        $(id).fadeOut(300);
        //toast_container.removeChild(alert);
    }, 5000);
}

function make_random_string(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
        charactersLength));
    }
    return result;
}*/

function disable_example_checkbox(){
    $('.example-checkbox').attr("disabled", true);
}

function enable_example_checkbox(){
    $('.example-checkbox').attr("disabled", false);
}

function exampleCheckboxClick(checkbox){
    var example_input_id = "#" + checkbox.value;
    var example_text = document.querySelector(example_input_id).value;

    if (value_empty_check(example_text)){
        return ;
    }

    if (checkbox.checked){
        add_answer(example_text);
    }else{
        remove_answer(example_text);
    }
}

function answer_length_error_check(){
    var answer_input = document.querySelector('#answer-input').value;
    var answer_list = answer_input.split("|");
    var answer_length = send_data["answer_length"];
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
    return false;
}

function check_answer(){
    var answer_input = document.querySelector('#answer-input').value;
    var answer_list = answer_input.split("|");

    var examples = document.getElementsByName('multiple-example');
    for(var j=0; j < answer_list.length; j++){
        var answer_match = false;
        var answer = answer_list[j];
        var answer = answer.trim();
        console.log("answer: " + answer);
        for(var i = 0; i < examples.length; i++){
            var example = examples[i].value;
            example = example.trim();

            if(example && example != '') {
                if (example == answer){
                    console.log(answer + " / " + example);
                    answer_match = true;
                    break;
                }
            }
        }
        if (!answer_match){
            console.log("no match answer: " + answer);
            return false;
        }
    }
    return true;
}

function add_answer(text){
    var answer_text = document.querySelector("#answer-input").value;

    text = text.trim();
    if (value_empty_check(answer_text)){
        answer_text = text;
    }else{
        answer_text += "|" + text;
    }
    document.querySelector("#answer-input").value = answer_text;
}

function remove_answer(text){
    var answer_text = document.querySelector("#answer-input").value;
    if (value_empty_check(answer_text)){
        return ;
    }else{
        var splits = answer_text.split("|");
        var i;

        for (i = 0; i < splits.length; i++) {
            console.log(text + " / " + splits[i])
            if (splits[i] == text){
                // find remove text
                console.log("find remove text " + splits[i]);
                if (i == 0){
                    if (splits.length == 1){
                        answer_text = answer_text.replace(text, "");
                    }else{
                        answer_text = answer_text.replace(text+"|", "");
                    }

                    console.log("set answer test: " + answer_text);
                    document.querySelector("#answer-input").value = answer_text;
                }else {
                    answer_text = answer_text.replace("|" + text, "");
                    console.log("set answer test: " + answer_text);
                    document.querySelector("#answer-input").value = answer_text;
                }
            }
        }
    }
}

function openNav() {
    var width = document.getElementById("preview-sidebar").style.width;
    console.log("width: " + width);
    if (width == "0px" || value_empty_check(width) ){
        setPreview();
        document.getElementById("preview-sidebar").style.width = "320px";

    }else{
        document.getElementById("preview-sidebar").style.width = "0px";
    }

  //document.getElementById("preview-button").style.marginLeft = "250px";
}



function hidePreview(){
    document.getElementById("preview-sidebar").style.width = "0px";
}

function setPreview(){
    var service_type = send_data["service_type"];
    var detail_type = send_data["detail_type"];

    var countdown = send_data["countdown"];

    var content_container = document.querySelector('#preview-contents-container');
    while (content_container.hasChildNodes()) {
        content_container.removeChild(content_container.firstChild);
    }

    if (service_type == "quiz"){
        var title = send_data["question"];
        var title_label = document.createElement('label');
            title_label.setAttribute('class','preview-service-title');
            content_container.appendChild(title_label);


        document.querySelector('#preview-service-type').innerHTML = "실시간 퀴즈";
        document.querySelector('#preview-countdown').innerHTML = countdown;
        document.querySelector('#preview-submit-button').innerHTML = '\xa0\xa0\xa0\xa0제출하기\xa0\xa0\xa0\xa0';

        console.log("detail type: " + detail_type)
        if (detail_type == "multi"){
            var example_list = send_data["examples"].split("|");

            for(var j=0; j < example_list.length; j++){
                var example = example_list[j];
                var example_label = document.createElement('label');
                    example_label.setAttribute('class','preview-example');
                    example_label.innerHTML = example;
                content_container.appendChild(example_label);
            }

            var select_count = send_data["select_count"];
            if ( select_count != "1"){
                title = title + " ( 선택: " + select_count + "개 )";
            }

        }else {


            var single_type = send_data["single_quiz_type"];
            console.log("single type: " + single_type)
            if (single_type == "string-length"){
                var hint_container = document.createElement('div');
                    hint_container.setAttribute('class','hint-container');
                    content_container.appendChild(hint_container);

                var answer_length = send_data["answer_length"];
                var answer_length_int = parseInt(answer_length)
                var line_break = 5;
                if (answer_length_int > 5){
                    line_break = parseInt(answer_length_int / 2) + answer_length_int % 2;
                }

                console.log("line break : " + line_break.toString)

                for (var i=0; i<answer_length_int; i++){
                    if (i == line_break){
                        hint_container.appendChild(document.createElement('br'));
                    }
                    console.log("add hint: " + i.toString())
                    var hint_label = document.createElement('label');
                        hint_label.setAttribute('class','preview-answer-length-hint');
                        //example_label.innerHTML = example;
                    hint_container.appendChild(hint_label);

                }
                title = title + " ( 글자수: " + answer_length + "자 )";
            }


            var answer_input_label = document.createElement('label');
                    answer_input_label.setAttribute('class','preview-answer-input');
                    answer_input_label.innerHTML = "입력";
                content_container.appendChild(answer_input_label);

        }
        title_label.innerHTML = title;


    }else if(service_type == "info"){
        var title = send_data["service_title"];
        var title_label = document.createElement('label');
        title_label.setAttribute('class','preview-service-title');
        content_container.appendChild(title_label);
        title_label.innerHTML = title;

        document.querySelector('#preview-service-type').innerHTML = "실시간 정보";
        document.querySelector('#preview-countdown').innerHTML = countdown;
        document.querySelector('#preview-submit-button').innerHTML = '\xa0\xa0\xa0\xa0더 알아보기\xa0\xa0\xa0\xa0';

        var info_image = document.createElement('img');
            info_image.setAttribute('class','preview-service-info-image');
            info_image.src = send_data["info-image"];
            content_container.appendChild(info_image);


        var describe = send_data["describe"];
        var info_describe = document.createElement('p');
            info_describe.setAttribute('class','preview-service-info-decribe');
            info_describe.innerHTML = describe.replace(/(?:\r\n|\r|\n)/g, '<br>');
            content_container.appendChild(info_describe);

    }else if(service_type == "vote"){

        var title = send_data["question"];
        var title_label = document.createElement('label');
            title_label.setAttribute('class','preview-service-title');
            content_container.appendChild(title_label);
            title_label.innerHTML = title;

        document.querySelector('#preview-service-type').innerHTML = "실시간 투표";
        document.querySelector('#preview-countdown').innerHTML = countdown;
        document.querySelector('#preview-submit-button').innerHTML = '\xa0\xa0\xa0\xa0제출하기\xa0\xa0\xa0\xa0';
    }else {

    }
}


function autocomplete(inp) {

    //console.log(tv_programs["tv_programs"])
    arr = tv_programs["tv_programs"]
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
}

/*An array containing all the country names in the world:*/
var countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre & Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts & Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Turks & Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];

/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
autocomplete(document.getElementById("program_title"));


function openModal() {
    $(".table_row").removeClass("highlight");
    var modal = document.getElementById("load-modal");
    set_opaque_background();
    modal.style.display = "block";
    load_service_data = {};

  //document.getElementById("preview-button").style.marginLeft = "250px";
}

function closeModal() {
    var modal = document.getElementById("load-modal");
    modal.style.display = "none";
    unset_opaque_background();

  //document.getElementById("preview-button").style.marginLeft = "250px";
}



var load_service_data = {};

$('.table_row').click(function(){

    var selected = $(this).hasClass("highlight");
    $(".table_row").removeClass("highlight");
    if(!selected)
        $(this).addClass("highlight");


    var program_title = $(this).find('.td_program_title').text();
    var service_type_display = $(this).find('.td_service_type').text();
    var detail_type_display = $(this).find('.td_detail_type').text();
    var service_title = $(this).find('.td_service_title').text();
    var countdown = $(this).find('.td_countdown').text();
    var service_contents_str = $(this).find('.td_service_contents').text();

    var service_contents = JSON.parse(service_contents_str);

    var service_type = get_service_type_from_display(service_type_display);
    var detail_type = get_detail_type_from_display(detail_type_display);


    load_service_data = {
        "program_title": program_title,
        "service_type": service_type,
        "detail_type": detail_type,
        "service_title": service_title,
        "countdown": countdown,
    };
    if (service_type == "quiz"){
        load_service_data["question"] = service_contents["question"];

        var answer_include = service_contents["answer_include"];
        load_service_data["answer_include"] = answer_include;
        if (answer_include == "include"){
            load_service_data["answer"] = service_contents["answer"];
        }

        if (detail_type == "multi"){
            load_service_data["examples"] = service_contents["examples"];
            load_service_data["select_count"] = service_contents["select_count"];
        }else{
            var single_type = service_contents["single_quiz_type"];
            load_service_data["single_quiz_type"] = single_type;
            if (single_type == "string-length"){
                load_service_data["answer_length"] = service_contents["answer_length"];
            }
        }
        //console.log(question + "/" + answer_include);
    }else if (service_type == "info"){
        load_service_data["info-link"] = service_contents["link"];
        load_service_data["describe"] = service_contents["describe"];
        //console.log(info_link + "/" + describe);
    }else {
        load_service_data["question"] = service_contents["question"];
        load_service_data["examples"] = service_contents["examples"];
    }

    console.log(load_service_data)
})

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

function setServiceData(){
    var service_type = load_service_data["service_type"];
    var detail_type = load_service_data["detail_type"];


    document.querySelector('#service_type').value = service_type;
    document.querySelector('#detail_type').value = detail_type;
    document.querySelector('#program_title').value = load_service_data["program_title"];
    document.querySelector('#title-input').value = load_service_data["service_title"];
    document.querySelector("#countdown-input").value = load_service_data["countdown"];


    if (service_type == "quiz"){
        document.querySelector('#question-input').value = load_service_data["question"];


        if (detail_type == "multi"){
            var example_elements = document.getElementsByName('multiple-example');
            var examples = load_service_data["examples"];
            var example_list = examples.split("|");
            for(var i=0; i < example_list.length; i++){
                example_elements[i].value = example_list[i]
                if(i >= 4){
                    document.querySelector('#add-quiz-example-button').onclick();
                }
            }
            document.querySelector('#duplicate-input').value = load_service_data["select_count"];
        }else{

            var single_type = load_service_data["single_quiz_type"];

            if (single_type == "string-length"){
                document.getElementById("single-quiz-string-length").checked = true;
                document.querySelector('#string-length-input').value = load_service_data["answer_length"];
            }else{
                document.getElementById("single-quiz-normal").checked = true;
            }
            single_quiz_radio_set()
        }

        var answer_include = load_service_data["answer_include"];
        if (answer_include == "include"){
            document.getElementById("answer-radio-include").checked = true;
            document.querySelector('#answer-input').value = load_service_data["answer"];
        }else{
            document.getElementById("answer-radio-exclude").checked = true;
        }
        answer_radio_set()
        //console.log(question + "/" + answer_include);
    }else if (service_type == "info"){
        document.querySelector('#info-link').value = load_service_data["info-link"];
        document.querySelector('#service_describe').value = load_service_data["describe"];
        toast_message(TOAST_WARNING, "이미지 파일은 불러오지 않습니다");

    }else {
        //load_service_data["question"] = service_contents["question"];
        //load_service_data["examples"] = service_contents["examples"];
    }

}

function set_answer_checked() {
    var answer_input = document.querySelector('#answer-input').value;
    var answer_list = answer_input.split("|");

    var examples = document.getElementsByName('multiple-example');
    var checkboxes = document.getElementsByClassName('example-checkbox');

    for(var j=0; j < answer_list.length; j++){
        var answer_match = false;
        var answer = answer_list[j];
        var answer = answer.trim();
        console.log("answer: " + answer);
        for(var i = 0; i < examples.length; i++){
            var example = examples[i].value;
            example = example.trim();

            if(example && example != '') {
                if (example == answer){
                    console.log(answer + " / " + example);
                    checkboxes[i].checked = true
                    break;
                }
            }
        }
        if (!answer_match){
            console.log("no match answer: " + answer);
        }
    }
}

function serviceSetClick(){
    if (Object.keys(load_service_data).length === 0) {
        toast_message(TOAST_ERROR, "리스트에서 서비스 선택 필수");
        return ;
    }
    setServiceInit();
    setServiceData();
    toast_message(TOAST_MESSAGE, "서비스 불러오기 성공");
    closeModal();

}

function serviceInitClick(){
    setServiceInit();
    toast_message(TOAST_MESSAGE, "서비스 초기화 성공");

}

function setServiceInit(){
    document.querySelector('#service_type').value = "quiz";
    document.querySelector('#detail_type').value = "multi";
    document.querySelector('#program_title').value = "";
    document.querySelector('#title-input').value = "";

    document.querySelector('#question-input').value = "";
    for(var i = 0; i < hidden_examples.length; i++){
        hidden_examples[i].hide();
    }

    for(var i = 0; i < hidden_vote_examples.length; i++){
        hidden_vote_examples[i].hide();
    }

    var example_elements = document.getElementsByName('multiple-example');
    for(var i=0; i < example_elements.length; i++){
        example_elements[i].value = "";
    }
    document.querySelector('#duplicate-input').value = "";
    document.getElementById("single-quiz-normal").checked = true;
    document.querySelector('#string-length-input').value = "";
    document.getElementById("answer-radio-exclude").checked = true;
    document.querySelector('#answer-input').value = "";

    document.querySelector('#input-info-image').value = "";
    $('#info-image').width(0).height(0);
    document.querySelector('#info-link').value = "";
    document.querySelector('#service_describe').value = "";
    document.querySelector("#countdown-input").value = "";


}