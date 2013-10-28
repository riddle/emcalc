
/*
		Em Calculator 2.0
		------------------------------

		copyright Piotr Petrus (riddle)
		2007

*/

// if the Firebug-like console API is not present, freeload will not throw errors
if( !('console' in window) || !('firebug' in console)) {
  var names = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml',
  'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];

  window.console = {};
  for( var i = 0; i < names.length; ++i ) {
    window.console[names[i]] = function(){};
  }
}

// globalStorage engine
var setValue, getValue, remValue;

if (window._globalStorage) {
	// at this moment firefox 2.0 only
	var glStorage = globalStorage.namedItem(document.domain);
	setValue = function(key, value) { glStorage.setItem(key, value); }
	remValue = function(key) { glStorage.removeItem(key); }
	getValue = function(key, dfault) {
		var data = glStorage.getItem(key);
		return (data) ? data.value : dfault;
	}
} else {
	// if no fx2, we can only use cookies
	setValue = function(key, value) {
		if (value.length > 4000) {
			var ohrly = confirm('Warning.\n\nSession you\'re about to save exceeds 4000 characters thus it may not be saved correctly. If you need to save large session use browser supporting window.globalStorage.\n\nDo you want to save anyway?');
			if (!ohrly) { return; }
		}
		$.cookie(key, value, {expires: 365});
	}
	remValue = function(key) { $.cookie(key, ''); }
	getValue = function(key, dfault) {
		var data = $.cookie(key);
		return (data) ? data : dfault;
	}
}

var EmCalc = {

	start: function() {
		this.appendOptionsHTML();
		this.readCookies();
		this.toggleChangelog();
		this.optionsTabs();
		this.listSessions();
		this.settingsActions();
		this.sessionActions();
	},
	
	number: /^[0-9\.]+$/,
	numberCanNeg: /^-?[0-9\.]+$/,

	messages: {

	},

	appendOptionsHTML: function() {
		// downloads xml with <div id="options"/> contents
		var global = this;
		var html = '<div id="options"> <ul id="tabs"> <li><a href="#sessions">Sessions</a></li> <li><a href="#settings">Settings</a></li> </ul> <form action="" id="sessions"> <fieldset> <h2>Sessions</h2> <ul id="sessionActions"> <li><input id="sessionSave" type="submit" value="Save" /></li> <li><input id="sessionDelete" type="submit" value="Delete" /></li> </ul> <div id="sessionList"> <select size="5"> <option class="new" value="new">New session</option> </select></div> </fieldset> </form> <form action="" id="settings"> <fieldset> <h2>Settings</h2> <dl> <dt> <label for="fontSize">Default font size</label> </dt> <dd> <input id="fontSize" type="text" size="2" maxlength="2" value="16" autocomplete="off" /> px </dd> <dt> <label for="decimalPlaces">Decimal places</label> </dt> <dd> <input id="decimalPlaces" type="text" size="2" maxlength="2" value="3" autocomplete="off" /> </dd> <dd class="alone"> <label for="askNodeNames"><input id="askNodeNames" type="checkbox" /> Ask for node names</label> </dd> <dd class="alone"><input id="saveSettings" type="submit" value="Save" /></dd> </dl> </fieldset> </form></div>';
		
				$('#nojs').remove();
				$('#panel').prepend(html);
				$('dd').after('<div class="cl"></div>');
				$('#static').append('<div id="toggle">Toggle</div>');
				global.resetNodeTree();
	},

	readCookies: function() {
		// reads info if panel should be visible or not
		var cookiePanelHidden = $.cookie('emcalc.toggle');
		if (cookiePanelHidden) {
			$('#panel').hide();
			$('#toggle').toggle(this.showPanel, this.hidePanel);
		} else {
			$('#toggle').addClass('fix').toggle(this.hidePanel, this.showPanel);
		}
		// reads defaults (font size and decimal places)
		var cookieSettings = $.cookie('emcalc.settings');
		if (cookieSettings) {
			var s = cookieSettings.split('#');
			$('#fontSize').val(s[0]);
			$('#decimalPlaces').val(s[1]);
			console.log(s[2]);
			$('#askNodeNames')[0].checked = (s[2] == 'true') ? true : false
		}
	},

	hidePanel: function() {
		// hides panel
		$(this).removeClass('fix');
		$('#panel').hide();
		$.cookie('emcalc.toggle', 'true', {expires: 365});
	},

	showPanel: function() {
		// shows panel
		$(this).addClass('fix');
		$('#panel').show();
		$.cookie('emcalc.toggle', '', {expires: 365});
	},

	toggleChangelog: function() {
		var $text = $('#text');
		$text.hide();
		$('#more').toggle(function() {
			$text.show();
		}, function() {
			$text.hide();
		});
	},

	resetNodeTree: function() {
		var ul = document.createElement('ul'),
			li = document.createElement('li'),
			root = this.createNode('body', true);
		$('#ems').empty().append(ul).find('ul').attr('id', 'body').append(li).find('li').addClass('lv1');
		$(root).appendTo(li).find('input:first').focus();
	},

	recalculateNodes: function() {
		$('#body input:first').keyup();
	},

	optionsTabs: function() {
		var
			which = $.cookie('curtab') || 'sessions',
			forms = $('#options').children('form'),
			links = $('#tabs a');
		forms.not('#' + which).hide();
		links.bind('click', function(e) {
			var tab = this.href.split('#')[1];
			forms.show().not('#' + tab).hide();
			links.parent().removeClass('active');
			$(this).parent().addClass('active');
			$.cookie('curtab', tab);
			e.preventDefault();
		}).filter('[@href="#' + which + '"]').parent().addClass('active')
	},
	
	changeFieldValue: function(field, key, allowNegative) {
		if (key == 38) {
			field.value = field.value || 0;
			field.value = parseInt(field.value) + 1
		} else if (key == 40) {
			field.value = field.value || 0;
			var temp = parseInt(field.value) - 1;
			if (allowNegative) {
				field.value = temp;
			} else {
				if (temp >= 0) {
					field.value = temp
				} else {
					field.value = 0
				}
			}
		} else if (key == 33) {
			field.value = field.value || 0;
			field.value = parseInt(field.value) + 10;
		} else if (key == 34) {
			field.value = field.value || 0;
			var temp = parseInt(field.value) - 10;
			if (allowNegative) {
				field.value = temp;
			} else {
				if (temp >= 0) {
					field.value = temp;
				} else {
					field.value = 0
				}
			}
		}
	},
	
	selectField: function(field) {
		field.focus();
		if (document.selection) {
		} else {
			if (field.selectionStart && field.selectionEnd) {
				field.selectionStart = 0;
				field.selectionEnd = field.value.length
			}
		}
	},

	settingsActions: function() {
		$('#settings')
			.bind('submit', this.saveSettings)
			.find('input[@type=text]').bind('keyup', this, function(e) {
				var global = e.data;
				if (this.value.match(global.number)) {
					var key = e.charCode || e.keyCode || 0;
					global.changeFieldValue(this, key, false);
					global.recalculateNodes();
				}
			});
	},

	saveSettings: function(e) {
		var fontsize = $('#fontSize').val();
		var decimals = $('#decimalPlaces').val();
		var asknname = $('#askNodeNames')[0].checked ? 'true' : '';
		$.cookie('emcalc.settings', fontsize + '#' + decimals + '#' + asknname, {expires: 365});
		e.preventDefault();
	},

	editName: function(e) {
		var
			global = e.data,
			changeName = document.createElement('input'),
			spanCont = document.createElement('span');
		$(spanCont).addClass('nodeNameEdit').append(changeName);
		$(changeName).addClass('edit').val($(this).text()).bind('keypress', this, function(e) {
			var element = e.data;
			var key = e.charCode || e.keyCode || 0;
			if (key == 13) {
				var n = $(this).val();
				if (n) {
					$(element).text(n);
				}
				$(this.parentNode).remove();
				$(element).show();
				$(window).unbind('click');
			} else if (key == 27) {
				$(this.parentNode).remove();
				$(element).show();
				$(window).unbind('click');
			}
		});
		$(window).bind('click', this, function(e) {
			var element = e.data;
			if (e.target !== changeName) {
				var n = $(changeName).val();
				if (n) {
					$(element).text(n);
				}
				$(changeName).remove();
				$(element).show();
				$(this).unbind('click');
			}
		});
		$(this).hide().before(spanCont);
		global.selectField($(changeName)[0]);
	},

	createNode: function() {

		var argNodeName = arguments[0] || 'node', argIsRoot = arguments[1], argNodePixels = arguments[2] || '';		
		var htmlSibling = '', htmlDelete = '';
		
		if (!argIsRoot) {
			htmlSibling = '<a class="nodeSibling" href="#" title="Add sibling">[Add sibling]</a>';
			htmlDelete = '<a class="nodeDelete" href="#" title="Delete this node & child nodes">[Delete node]</a>';
		}
		
		var htmlChunk = '<fieldset><span class="nodeName" title="Double click to edit">' + argNodeName + '</span><span> { </span><span class="nodePxs"><input type="text" class="text"/></span><span> px = </span><span class="nodeEms"><input type="text" class="text readonly" readonly=""/></span><span> }</span><span class="nodeActs">' + htmlSibling + '<a class="nodeChild" href="#" title="Add child">[Add child]</a></span>' + htmlDelete + '</fieldset>', 
		$form = $('<form></form>');
		
		$form.html(htmlChunk)
			.bind('submit', function(e) { e.preventDefault(); })
			.find('span')
				.filter('.nodeName').bind('dblclick', this, this.editName).end()
				.filter('.nodePxs')
					.find('input').val(argNodePixels).bind('keyup', this, this.calcFields).end().end()
				.filter('.nodeEms')
					.find('input').bind('click', this, function(e) { e.data.selectField(this); }).end().end().end()
			.find('a')
				.filter('.nodeSibling').bind('click', this, function(e) { e.data.addNode($form[0], 'sibling'); e.preventDefault(); }).end()
				.filter('.nodeChild').bind('click', this, function(e) { e.data.addNode($form[0], 'child'); e.preventDefault(); }).end()
				.filter('.nodeDelete').bind('click', this, this.deleteNode);
			
		return $form;
	},

	countPrevs: function(element) {
		var pS = element.previousSibling;
		var counter = 0;
		while (pS) {
			if (pS.nodeType != 1) { counter++; }
			pS = pS.previousSibling;
		}
		return counter;
	},

	addNode: function(handle, type) {
		var
			current = handle.parentNode,
			pos = (type == 'sibling') ? 0 : 1,
			nr = parseInt(current.className.split('lv')[1]) + pos;
			node = document.createElement('li'),
			name = 'node' + nr;
		if ($('#askNodeNames')[0].checked) {
			name = prompt('Enter node name:') || name;
		}
		$(node).addClass('lv' + nr).append(this.createNode(name));
		if (type == 'sibling') {
			$(current).after(node);
		} else {
			var ulist = $(current).children('ul')[0];
			if (ulist) {
				ulist.appendChild(node);
			} else {
				var ul = document.createElement('ul');
				ul.appendChild(node);
				current.appendChild(ul);
			}
		}
		this.savedStateHandler(false);
		$(node).find('input:first').focus();
	},

	deleteNode: function(e) {
		$(this.parentNode.parentNode.parentNode).remove();
		e.data.savedStateHandler(false);
		e.preventDefault();
	},

	roundDecimals: function(number, decimals) {
		var temp = Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals)
		return this.padZero(temp, decimals)
	},

	padZero: function(rounded, places) {
		var val = rounded.toString();
		var point = val.indexOf('.');
		if (point == -1) {
			len = 0;
			val += places > 0 ? '.' : '';
		}
		else {
			len = val.length - point - 1;
		}
		var pad = places - len;
		if (pad > 0) {
			for (var counter = 1; counter <= pad; counter++) {
				val += '0';
			}
		}
		return val;
	},

	calcFields: function(e) {
		var global = e.data;
		var key = e.charCode || e.keyCode || 0;
		if ((this.value.match(global.numberCanNeg)) || (this.value == '')) {
			global.changeFieldValue(this, key, true)
			if (this.value) {
				global.savedStateHandler(false);
			}
		}
		if (this.value.match(global.numberCanNeg)) {
			$.each($('#ems span.nodePxs input'), function(i) {
				var child = this.value;
				var parent = '';
				var block = this.parentNode.parentNode;
				var previous = block.parentNode.parentNode.parentNode;
				if ($(previous).attr('id') == 'body') {
					parent = $('#fontSize').val();
				} else {
					parent = $(previous.parentNode).find('form input.text:first').val();
				}
				if (parent.match(global.number)) {
					$(block).find('input.text:nth(1)').val(global.pixToEm(parent, child, $('#decimalPlaces').val()) + 'em');
				}
			});
		}
	},

	pixToEm: function(parentPix, childPix, decimals) {
		return this.roundDecimals(childPix / parentPix, decimals);
	},

	nodePrefix: '_',
	sessionPrefix: 'ss-',
	sessionsId: 'sessions',
	sessionCurrent: 0,
	sessionNewCreated: '',
	sessionMissing: 'Error. Session hasn\'t been found.',
	savedConfirm: 'Your current session isn\'t saved and will be lost. Do you want to proceed anyway?',
	savedState: true,

	savedStateHandler: function(state) {
		if (this.savedState != state) {
			this.savedState = state;
			var $options = $('#sessionList option');
			state ? $options.removeClass('unsaved') : $options.filter('[@selected]').addClass('unsaved')
		}
	},

	saveSession: function(e) {
	
		function insertToArray(arr, pos, item) {
			var a2 = arr.splice(pos);
			var a1 = arr.splice(0, pos);
			a1.push(item);
			arr = a1.concat(a2);
			return arr;
		}
		
		var global = e.data, levels = [];
		$('#body li').each(function(i) {
			this.id = global.nodePrefix + i;
			var $span = $(this).children('form').find('span');
			levels[i] = {
				n: $span.filter('.nodeName').text(),
				p: $span.filter('.nodePxs').find('input').val(),
				a: this.parentNode.parentNode.id.replace(global.nodePrefix, ''),
				c: this.className.replace('lv', '')
			}
		});

		var treeNodes = $.toJSON(levels), value;

		if (global.sessionCurrent == 0) {
			// create new session
			var sessionsNames = global.returnSessionList(), newSessionIndex = 0;
			if (sessionsNames) {
				newSessionIndex = sessionsNamesLen = sessionsNames.length;
				console.log('newSessionIndex: ', newSessionIndex, 'sessionsNamesLen: ', sessionsNamesLen);
				for (var i = 0; i < sessionsNamesLen; i++) {
					var
						item = sessionsNames[i],
						number = parseInt(item.v.replace(global.sessionPrefix, ''));
						console.log('number: ', number, 'i: ', i);
					if (number != i) {
						newSessionIndex = i;
						console.log('newSessionIndex: ', newSessionIndex);
						console.log(global.sessionPrefix + newSessionIndex);
						break;
					}
				}
			} else {
				sessionsNames = [];
			}
			var name = prompt('Podaj name', '')
			if (name) {
				var value = global.sessionPrefix + newSessionIndex;
				sessionsNames = insertToArray(sessionsNames, newSessionIndex, { n: name, v: value });
				setValue(global.sessionsId, $.toJSON(sessionsNames));
				setValue(value, treeNodes);
				global.sessionNewCreated = value;
			}
		} else {
			// overwrite existing
			var value = $('#sessionList option')[global.sessionCurrent].value;
			setValue(value, treeNodes);
		}

		global.listSessions();
		global.savedStateHandler(true);

	},
	
	returnSessionList: function() {
		var data = getValue(this.sessionsId, '');
		if (data) {
			data = $.parseJSON(data);
		}
		return data;
	},

	loadSession: function(e) {
		var 
			global = e.data,
			current = e.target,
			currentName = current.nodeName.toLowerCase(),
			selectLast;
		if (currentName == 'select') {
			// sometimes clicking on <select/> rather than on <option/>, selects last item
			current = $('option:last', current)[0];
			selectLast = true;
		}
		if ((currentName == 'option') || selectLast) {
			// if captured click occurs on <option/>, load session
			var proceed = true;
			// check if any changes has been made previously
			if (!global.savedState) {
				proceed = confirm(global.savedConfirm) ? true : false;
			}
			if (proceed) {
				global.sessionCurrent = current.index;
				var $body = $('#body');
				if (current.index == 0) {
					var li = document.createElement('li');
					$body.empty().append(li).find('li').addClass('lv1')
					.append(global.createNode('body', true)).find('input:first').focus();
				} else {
					var selected = current.value, data = getValue(selected, '');
					if (data) {
						var loadedData = $.parseJSON(data);
						$body.empty();
						for (var i = 0; i < loadedData.length; i++) {
							var item = loadedData[i];
							var root = (i == 0) ? true : false;
							var node = global.createNode(item.n, root, item.p);
							var litem = document.createElement('li');
							litem.id = global.nodePrefix + i;
							litem.className = 'lv' + item.c;
							if (root) {
								$body.append(litem);
							} else {
								var $parent = $('#' + global.nodePrefix + item.a);
								var $ulist = $parent.find('ul:first');
								if (!$ulist.length) {
									$ulist = $(document.createElement('ul'));
									$parent.append($ulist);
								}
								$ulist.append(litem);
							}
							$('#' + global.nodePrefix + i).append(node);
						};
						$body.children('li:first').children('form')
							.find('span.nodePxs input').trigger('keyup');
					} else {
						alert(global.sessionMissing);
					}
				}
				global.savedStateHandler(true);
			} else {
				$('#sessionList').blur()
					.find('option')[global.sessionCurrent].selected = true;
			}
		}
	},
	
	deleteSession: function(e) {
		var global = e.data;
		if (global.sessionCurrent != 0) {
			var ohry = confirm('Do you really want to delete this session?');
			if (ohry) {
				var 
					$options = $('#sessionList option'),
					value = $options[global.sessionCurrent].value,
					sessions = global.returnSessionList(),
					index = -1;
				if (sessions) {
					for (var i = 0; i < sessions.length; i++) {
						var item = sessions[i];
						if (item.v == value) {
							index = i;
						}
					}
					if (index != -1) {
						if (sessions.length == 1) {
							sessions = []
						} else {
							if (index == 0) {
								sessions.splice(0, 1);
							} else {
								sessions.splice(index, index)
							}
						}
						data = $.toJSON(sessions);
						setValue(global.sessionsId, data);
						remValue(value);
						$options.filter('[@value="' + value + '"]').remove();
						$options[0].selected = true;
						global.sessionCurrent = 0;
						global.resetNodeTree();
					}
				}
			}
		}
	},

	listSessions: function() {
		var $list = $('#sessionList select');
		$list.find('option').not('.new').remove();
		var $buttons = $('#sessionLoad')/*.add('#sessionDel')*/;
		var sessionNames = this.returnSessionList();
		if (sessionNames) {
			$list.add($buttons).removeAttr('disabled');
			for (var i = 0; i < sessionNames.length; i++) {
				var item = sessionNames[i];
				$list.append('<option value="' + item.v + '">' + item.n + '</option>')
			}
		} else {
			$list.empty().append('<option class="new" selected="selected">New session</option>')
				.add($buttons).attr('disabled', 'disabled');
		}
		var $options = $list.find('option'), global = this;

		if (this.sessionNewCreated) {
			$options.each(function() {
				if (this.value == global.sessionNewCreated) {
					global.sessionCurrent = this.index
				}
			});
			this.sessionNewCreated = '';
		}

		$options[this.sessionCurrent].selected = true;
	},

	sessionActions: function() {
		$('#sessionList').bind('click', this, this.loadSession);
		$('#sessionSave').bind('click', this, this.saveSession);
		$('#sessionDelete').bind('click', this, this.deleteSession)
		$('#sessions').bind('submit', function(e) { e.preventDefault(); });
	}

}//end

$().ready(function() {
	EmCalc.start();
});