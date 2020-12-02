document.getElementById("action-title").innerHTML = "서비스 제작"
var program_title;
var service_type;
var detail_type;
var service_title;
var service_text1;
var service_text2;
var service_text3;
var service_text4;
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

var roomName = document.getElementById("interactive-service-channel").textContent;
console.log("room name: " + roomName);

if (roomName == "ADMIN") {
    $("#channel-form").show();
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



var reserve_config = $('.reservation_config');
var repeat_config = $('.repetition_config');
reserve_config.hide();
repeat_config.hide();

var hidden_examples = [$('#multiple-example-input5'), $('#multiple-example-input6'), $('#multiple-example-input7'),
                        $('#multiple-example-input8'),$('#multiple-example-input9'), $('#multiple-example-input10')];

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
     if ( myRadio.value == 'include' ) {
        document.getElementById("answer-input").required = true;
     } else {
        document.getElementById("answer-input").required = false;
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



$(document).ready(function () {
    var step1 = $('.step-1'), step2 = $('.step-2'), step3 = $('.step-3'), step4 = $('.step-4');
    var steps = [step1, step2, step3, step4];

    var navListItems = $('div.setup-panel div a'),
        allWells = $('.setup-content'),
        allNextBtn = $('.nextBtn');

    allWells.hide();



    var current_step =  steps[current_step_num];
    current_step.show();
    current_step.find('input:eq(0)').focus();

    navListItems.click(function (e) {
        e.preventDefault();
        var $target = $($(this).attr('href')), // form
            $item = $(this);  // step button

        if (!$item.hasClass('disabled')) {
            navListItems.removeClass('btn-success').addClass('btn-default');
            $item.addClass('btn-success');
            //allWells.hide();
            //$target.show();
            //$target.find('input:eq(0)').focus();
        }
    });

    /*navListItems.click(function (e) {
        e.preventDefault();
        var $target = $($(this).attr('href')), // form
            $item = $(this);  // step button


        if (!$item.hasClass('disabled')) {
            navListItems.removeClass('btn-success').addClass('btn-default');
            $item.addClass('btn-success');
            allWells.hide();
            $target.show();
            $target.find('input:eq(0)').focus();

        }
    });*/

    allNextBtn.click(function () {


        var curStep = $(this).closest(".setup-content"),
            curStepBtn = curStep.attr("id"),
            nextStepWizard = $('div.setup-panel div a[href="#' + curStepBtn + '"]').parent().next().children("a"),
            curInputs = curStep.find("input[type='text'],input[type='url']"),
            isValid = true;

        $(".form-group").removeClass("has-error");
        for (var i = 0; i < curInputs.length; i++) {
            if (!curInputs[i].validity.valid) {
                isValid = false;
                $(curInputs[i]).closest(".form-group").addClass("has-error");
            }
        }

        if (isValid) {
            nextStepWizard.removeAttr('disabled').trigger('click');

            var current_step =  steps[current_step_num];
            var next_step =  steps[current_step_num+1];
            current_step.hide();
            next_step.show();
            next_step.find('input:eq(0)').focus();
            current_step_num += 1;


            if (current_step_num == 1){  //step2
                program_title = document.querySelector('#program_title').value;
                service_type = document.querySelector('#service_type').value;
                detail_type = document.querySelector('#detail_type').value;
                owner = roomName;
                if(roomName == "ADMIN"){
                    channel_name = document.querySelector('#channel_name').value;
                    category = "menual";
                }else{
                    channel_name = roomName;
                    category = "tv"
                }
                chatSocket = new WebSocket(
                    'wss://' + window.location.host +
                    '/ws/chat/' + channel_name + '/');

                    chatSocket.onclose = function(e) {
                        console.error('Chat socket closed unexpectedly');
                    };

                //document.getElementById("step-2-header").innerHTML = program_title + service_type + detail_type;

                for(key in service_obj) {
                    if(key == service_type){
                        service_obj[key].show()
                    }else{
                        service_obj[key].hide()
                    }
                }
                if (service_type == 'quiz'){
                    if (detail_type != 'multi'){
                        var examples = $('.quiz-examples');
                        examples.hide();
                        document.getElementById("multiple-example-input1").required = false;
                        document.getElementById("multiple-example-input2").required = false;
                    }else {
                        var examples = $('.quiz-examples');
                        examples.show();
                        document.getElementById("multiple-example-input1").required = true;
                        document.getElementById("multiple-example-input2").required = true;
                    }

                    // for info
                    document.getElementById("service_describe").required = false;
                    document.getElementById("info-link").required = false;

                    // for vote
                    document.getElementById("vote-question-input").required = false;
                    document.getElementById("vote-example-input1").required = false;
                    document.getElementById("vote-example-input2").required = false;

                }else if (service_type == 'info'){
                    // for quiz
                    document.getElementById("question-input").required = false;
                    document.getElementById("answer-input").required = false;
                    document.getElementById("multiple-example-input1").required = false;
                    document.getElementById("multiple-example-input2").required = false;

                    //for vote
                    document.getElementById("vote-question-input").required = false;
                    document.getElementById("vote-example-input1").required = false;
                    document.getElementById("vote-example-input2").required = false;

                }else if (service_type == 'vote'){
                    if (detail_type != 'multi'){
                        var examples = $('.vote-examples');
                        examples.hide();
                        document.getElementById("vote-example-input1").required = false;
                        document.getElementById("vote-example-input2").required = false;
                    }else {
                        var examples = $('.vote-examples');
                        examples.show();
                        document.getElementById("vote-example-input1").required = true;
                        document.getElementById("vote-example-input2").required = true;
                    }
                    // for quiz
                    document.getElementById("question-input").required = false;
                    document.getElementById("answer-input").required = false;
                    document.getElementById("multiple-example-input1").required = false;
                    document.getElementById("multiple-example-input2").required = false;

                    // for info
                    document.getElementById("service_describe").required = false;
                    document.getElementById("info-link").required = false;
                }
                example_add_count = 0;



            }else if (current_step_num == 2) {
                service_title = document.querySelector('#title-input').value;
                if (service_type == 'quiz') {
                    service_text1 = document.querySelector('#question-input').value;
                    if (detail_type == 'multi'){
                        var examples = document.getElementsByName('multiple-example');
                        var example_list = examples[0].value;
                        for(var i = 1; i < examples.length; i++){
                            if(examples[i].value && examples[i].value != '') {
                                example_list += '|';
                                example_list += examples[i].value;
                            }
                        }
                        service_text2 = example_list;
                    }

                    var answer_radios = document.getElementsByName('answer_radio');
                    for(var i = 0; i < answer_radios.length; i++){
                        if(answer_radios[i].checked){
                            service_text3 = answer_radios[i].value;
                        }
                    }
                    if (service_text3 == 'include') {
                        service_text4 = document.querySelector('#answer-input').value;
                    }
                    countdown = document.querySelector('#countdown-input').value;
                }else if (service_type == 'info'){
                    service_text1 = document.querySelector('#service_describe').value;
                    service_text2 = document.querySelector('#info-image').src;
                    service_text3 = document.querySelector('#info-link').value;

                }else if (service_type == 'vote'){
                    service_text1 = document.querySelector('#vote-question-input').value;
                    if (detail_type == 'multi'){
                        var examples = document.getElementsByName('vote-example');
                        var example_list = examples[0].value;
                        for(var i = 1; i < examples.length; i++){
                            if(examples[i].value && examples[i].value != '') {
                                example_list += '|';
                                example_list += examples[i].value;
                            }
                        }
                        service_text2 = example_list;
                    }
                }

            }else if (current_step_num == 3) {
                var final_text1;
                var final_text2;
                var final_text3;
                var final_text4;
                document.getElementById("final_program_title").innerHTML = program_title;
                document.getElementById("final_service_type").innerHTML = get_service_type(service_type);
                document.getElementById("final_detail_type").innerHTML = get_detail_type(detail_type);

                var process_radios = document.getElementsByName('process_radio');
                for(var i = 0; i < process_radios.length; i++){
                    if(process_radios[i].checked){
                        process_type = process_radios[i].value;
                    }
                }

                document.getElementById("final_service_title").innerHTML = service_title;
                if (service_type == 'quiz') {

                    final_text1 = '  - 질문 : ' + service_text1;
                    final_text2 = '  - 보기 : ' + service_text2;
                    if (service_text3 == 'include'){
                        final_text3 = '  - 정답 포함 여부 : 포함';
                        final_text4 = '  - 정답 : ' + service_text4;
                    }else{
                        final_text3 = '  - 정답 포함 여부 : 불포함';
                        final_text4 = '  - 정답 : -';
                    }
                    document.getElementById("final_service_text1").innerHTML = final_text1;
                    document.getElementById("final_service_text2").innerHTML = final_text2;
                    document.getElementById("final_service_text3").innerHTML = final_text3;
                    document.getElementById("final_service_text4").innerHTML = final_text4;
                }else if(service_type == 'vote') {
                    final_text1 = '  - 질문 : ' + service_text1;
                    final_text2 = '  - 보기 : ' + service_text2;
                    //final_text3 = service_text3;
                    //final_text4 = service_text4;
                    document.getElementById("final_service_text1").innerHTML = final_text1;
                    document.getElementById("final_service_text2").innerHTML = final_text2;
                }else{
                    final_text1 = '  - 설명 : ' + service_text1;
                    document.getElementById("final_service_text1").innerHTML = final_text1;

                    var div2 = document.getElementById("final_service_text2");
                    var aTag = document.createElement('a');
                    aTag.setAttribute('href',service_text3);
                    aTag.setAttribute('target', '_blank');
                    aTag.innerText = "<<< 링크 테스트 클릭 >>>";
                    div2.appendChild(aTag);


                    var elem = document.createElement("img");
                    //elem.setAttribute("src", service_text2);
                    elem.setAttribute("height", "300");
                    elem.setAttribute("width", "300");
                    elem.src = service_text2;
                    document.getElementById("final_service_text3").appendChild(elem);

                    //final_text3 = service_text3;
                    //final_text4 = service_text4;
                }

                var process_state = "";

                if (process_type == "reserve"){
                    process_info = {"type": process_type, "date": $('#process_date').val(), "time": $('#process_time').val()};

                }else if(process_type == "repeat"){
                    var checkedValue = "";
                    var inputElements = document.getElementsByClassName('weekdayCheckbox');
                    for(var i=0; inputElements[i]; ++i){
                          if(inputElements[i].checked){
                               checkedValue += inputElements[i].value;
                          }
                    }
                    process_info = {"type": process_type, "weekdays": checkedValue, "time": $('#process_time2').val()};


                }else{
                    process_info = {};
                }

                document.getElementById("final_process_type").innerHTML = get_process_type(process_type);
                if (process_type == "now"){
                    document.getElementById("final_process_info").innerHTML = "-"
                }else if(process_type == "repeat"){
                    document.getElementById("final_process_info").innerHTML = process_info["weekdays"] + "  " + process_info["time"];
                }else {
                    document.getElementById("final_process_info").innerHTML = process_info["date"] + "  " + process_info["time"];
                }

                document.getElementById("final_service_countdown").innerHTML = countdown;

            }
        }
    });

    $('div.setup-panel div a.btn-success').trigger('click');
});


document.querySelector('#service_submit').onclick = function(e) {



    chatSocket.send(JSON.stringify({
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
    }));
    location.reload(true);

};

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
        return "실시간 퀴즈";
    }else if (service_value == "info") {
        return "실시간 정보"
    }else if (service_value == "vote") {
        return "실시간 투표"
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

function get_process_type(process_value) {
    if (process_value == "now"){
        return "즉시 수행";
    }else if (process_value == "repeat") {
        return "반복 수행"
    }else if (process_value == "reserve") {
        return "예약 수행"
    }else {
        return "unknown"
    }
}