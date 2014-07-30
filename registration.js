$(function () {
	var DOMAIN = "www.pley.com"
	
	// debug mode, label, function
    var utility = {
		debug_mode: true, // ajax failed test : true is always succeed for ajax | false is failed for ajax
		label: {
			success_msg: 'Thank You for Registering!', // 
			fail_msg: 'Please send again later!',
			error_email: '* Please enter a valid email address.',
			error_required: '* This field is required.',
			error_password: '* Password do not match.'
		},
        getTimeStamp: function () {
            return "?tmstmp=" + (new Date()).getTime();
        }
    };
	
	// define ajax functions
    var ajaxCall = {
        processing: false,
        base: {
            _timestamp: 0,
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            timeout: 60000,
            beforeSend: function () {
                ajaxCall.processing = true;
                this._callee = this.url.match(/\/(\w+)\?/)[1];
                this._timestamp = (new Date()).getTime();
            },
            complete: function () {
                ajaxCall.processing = false;
                var service = this.url.match(/\/(\w+)\?/)[1],
                    duration = (new Date()).getTime() - this._timestamp;
                console.log("%s: %sms", service, duration);
            }
        },
        sendMsg: function (firstname, lastname, email, password) {
            var dfd = new $.Deferred();
            var postdata = {};
            postdata.firstname = firstname;
            postdata.lastname = lastname;
            postdata.email = email;
			postdata.password = password;
			
			if(utility.debug_mode){
				// return success without ajax
				dfd.resolve($.parseJSON(true));
			}else{
				// return do ajax
	            var req = {
	                url: "http://" + DOMAIN + "/Webservices/SendMsg" + utility.getTimeStamp(),
	                data: JSON.stringify(postdata),
	                error: function (xhr, t) {
	                    dfd.reject(t);
	                },
	                success: function (data) {
	                    dfd.resolve($.parseJSON(data.d));
	                }
	            };
			
	            try {
	                new $.ajax($.extend(req, ajaxCall.base));
	            } catch (err) {
	                console.log(err.Message);
	            }
			}
            return dfd;
        }
    };
	
    var timer = {
        _timer: null,
        reset: function (callback, interval) {
            if (typeof callback !== "undefined") {
                if (typeof interval == "undefined") {
                    var interval = 1000;
                }
                this.clear();
                this._timer = setInterval(callback, interval);
            }
        },
        clear: function () {
            try {
                clearInterval(this._timer);
            } catch (err) {
            }
        }
    };

	// Methods
	$.fn.checkForm = function(){
		// check to validate each input element
		var $input = $(this),
			$error = $input.siblings('.error')
			$li = $input.parent();
		var value = $(this).val();
		var is_email = $input.attr('id') == 'ipt_email' ? true : false,
			is_confirm = $input.attr('id') == 'ipt_confirmpassword' ? true : false,
			result_value = true,
			result_msg = '';
			
        if (value) {
			// email form only
			if(is_email){
	            var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	            result_value = regex.test(value);
				if(!result_value){
					result_msg = utility.label.error_email;
					result_value = false;
				}
			}else if(is_confirm){
				var password = $("#ipt_password").val();
				if(password != value)
				{
					result_msg = utility.label.error_password;
					result_value = false;
				}
			}
        } else {
			result_msg = utility.label.error_required;
			result_value = false;
        }
		$error.text(result_msg);
		if(result_value){
			$li.removeClass('error_box');
		}else{
			$li.addClass('error_box');
		}
		return result_value;
	}
	
	function closeLoading(){
		$('#loader').fadeOut();
		$('#btn_clear').trigger('click');
	}
	
    function checkAllForm() {
		$("#form input").each(function () {
			$(this).checkForm();
		});
		return $("#form li.error_box").length == 0;
    }

	// Events
    $('#form input').keyup(function (e) {
		// validate input value & exception case: email form to validate for correct email address
        var result = $(this).checkForm();
		if(e.keyCode ==13 && result){
			var $next = $(this).parent().next('li').find('input');
			if($next.length){
				$next.eq(0).focus();
			}else{
				$("#btn_send").trigger('click');
			}
		}
    });

    $('#btn_clear').on('click', function () {
		// clear all input form
        var $form = $("#form"),
			$input = $form.find("input");
			$error = $input.siblings('.error')
			$li = $input.parent();
			
        $input.val('');
		$error.text('');
		$li.removeClass('error_box');
    });

    $('#btn_send').on('click', function () {
        if (checkAllForm()) {
			var _result = null;
            var _index = 0;
			// keep default loading timer : cannot stop until 4 sec loading time
            timer.reset(function () {
                _index = (_index + 1);
                if (_index < 4) {
					if(_result != 'fail'){
	                    var text = $txt_loading.text();
	                    text += '.';
	                    $txt_loading.text(text);
						$loader.one('click', closeLoading);
					}
                } else {
					if(_result == 'success'){
						$txt_loading.text(utility.label.success_msg);
						$loader.one('click', closeLoading);
					}
                    timer.clear();
                }
            });
			
            var $loader = $("#loader"),
            	$txt_loading = $loader.find('.txt_loading');
            $txt_loading.text('Send ');
			$loader.fadeIn();
			
			// Send Ajax
			ajaxCall.sendMsg().done(function(){
				_result = 'success';
				if(_index >= 4){
					$txt_loading.text(utility.label.success_msg);
					timer.clear();
					
					if(_result && _index >= 4){
						$loader.one('click', closeLoading);
					}
				}
			}).fail(function(){
				_result = 'fail';
				$txt_loading.text(utility.label.fail_msg);
			});
        }
    });
});