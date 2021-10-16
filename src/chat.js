import React, {Component} from 'react'
import {MessageBox} from './start'
import {
  isIE,
  isEdge
} from "react-device-detect";
/*import adapter from 'webrtc-adapter';*/
import './css/chat.css'

function UserListBox(props) {
	return <ul className="userslistbox">{props.children}</ul>;
}

class ChatBox extends Component {
	constructor(props) {
		super(props);
		this.scrollWindow = this.scrollWindow.bind(this);
	}

	componentDidUpdate(prevProps) {
		this.scrollWindow();
	}

	scrollWindow() {

		const scrollHeight = this.chatWindow.scrollHeight;
		const height = this.chatWindow.clientHeight;
		const maxScrollTop = scrollHeight - height;
		this.chatWindow.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
	}

	render() {
		return <div className="chat_window" ref={(div) => {
			this.chatWindow = div;
		}} >{this.props.children}</div>;
	}
	
}

class ChatContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {input_text:'',chat_text:[],user_list:null,state_class:'state_indicator_off',
					  Msg:null,isChat:null,isDockPanel:' ',target_user:null,alertMsg:null,
					  videoMsg:null,closeMsg:null
					 };
		
		this.serverUrl = '';
		this.webSocket = null;
		this.isAlive = false;
		this.isControlsDisabled = true;
		this.target_user = null;
		this.msg_connect = {type:'connect_user',user_name:null,func:null};
		this.myUsername = this.props.user_name;
		this.countUpdate = 0;
		this.typeChat = '';

		this.webcamStream = null;
		this.mediaConstraints = { audio: true,video: { aspectRatio: { ideal: 1.33 } }};
		this.myPeerConnection = null;
		this.receiveVideo = null;
		this.localVideo = null;
		this.videoWidth = 0;
		this.videoHeight = 0;
	
		this.onChangeText = this.onChangeText.bind(this);
		this.onClickSend = this.onClickSend.bind(this);
		this.handlerKey = this.handlerKey.bind(this);
	
		this.AnimationEnd =  this.AnimationEnd.bind(this);
		this.AnimationEndDock =  this.AnimationEndDock.bind(this);
		this.chatClose =  this.chatClose.bind(this);
		this.undockVideoPanel =  this.undockVideoPanel.bind(this);
		this.dockVideoPanel =  this.dockVideoPanel.bind(this);

		this.log = this.log.bind(this);
		this.log_error = this.log_error.bind(this);
		this.reportError = this.reportError.bind(this);
		this.connect = this.connect.bind(this);
		this.ReconnectChat = this.ReconnectChat.bind(this);
		this.onOpenConnection = this.onOpenConnection.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.sendToServer = this.sendToServer.bind(this);
		this.CheckConnection = this.CheckConnection.bind(this);
		this.CreateUserList = this.CreateUserList.bind(this);

		this.invite = this.invite.bind(this);
		this.createPeerConnection = this.createPeerConnection.bind(this);
		this.handleGetUserMediaError = this.handleGetUserMediaError.bind(this);
		this.handleICECandidateEvent = this.handleICECandidateEvent.bind(this);
		this.handleICEConnectionStateChangeEvent = this.handleICEConnectionStateChangeEvent.bind(this);
		this.handleICEGatheringStateChangeEvent = this.handleICEGatheringStateChangeEvent.bind(this);
		this.handleSignalingStateChangeEvent = this.handleSignalingStateChangeEvent.bind(this);
		this.handleNegotiationNeededEvent = this.handleNegotiationNeededEvent.bind(this);
		this.handleVideoOfferMsg = this.handleVideoOfferMsg.bind(this);
		this.handleVideoAnswerMsg = this.handleVideoAnswerMsg.bind(this);
		this.handleTrackEvent = this.handleTrackEvent.bind(this);
		this.closeVideoCall = this.closeVideoCall.bind(this);
		this.handleHangUpMsg = this.handleHangUpMsg.bind(this);
		this.hangUpCall = this.hangUpCall.bind(this);
		this.videoCall = this.videoCall.bind(this);
		this.reInvite = this.reInvite.bind(this);
		this.closeVideoChat = this.closeVideoChat.bind(this);
		this.onResize = this.onResize.bind(this);
		this.applyAspectRatio = this.applyAspectRatio.bind(this);
	}

	onResize(event) {
		
		this.videoHeight = this.receiveVideo.clientHeight;
		this.videoWidth = this.receiveVideo.clientWidth;	
		console.log('new width=',this.videoWidth,'new height=',this.videoHeight);
		this.applyAspectRatio();
	}

	AnimationEnd() {
		if (!this.msg_connect.user_name && this.state.isChat=='show' && this.state.isDockPanel==' ') {

			this.setState ({Msg:'Нет связи с WebSocket сервером сигнализации или он выключен. Повторить попытку?'});
			
		}
		if (this.state.isChat=='close') {

			this.props.render();
		}
	}

	AnimationEndDock() {
		if (this.state.isDockPanel=='undock')
			this.setState({isDockPanel:null});
		if (this.state.isDockPanel=='dock')
			this.setState({isDockPanel:' '});
		if (this.state.isChat=='close') {

			this.props.render();
		}
	}

	dockVideoPanel() {
		if (this.state.isDockPanel != ' ')
			this.setState({isDockPanel:'dock'});
	}

	undockVideoPanel() {
		this.setState({isDockPanel:'undock'});
	}

	componentDidUpdate(prevProps) {
	
		if (this.state.isChat=='show' && (isIE || isEdge) && !this.msg_connect.user_name && this.countUpdate<2) {
			if (++this.countUpdate==2) {	

				this.setState ({Msg:'Нет связи с WebSocket сервером сигнализации или он выключен. Повторить попытку?'});
			}			
		}
		if (this.state.isChat=='close' && (isIE || isEdge)) {
			setTimeout (()=>{this.props.render();},1500);
		}
		if (this.typeChat == 'videoChat' && !this.videoHeight && !this.videoWidth) {
			this.videoHeight = this.receiveVideo.clientHeight;
			this.videoWidth = this.receiveVideo.clientWidth;	
			console.log('start width=',this.videoWidth,'start height=',this.videoHeight);		
		}
		
	}

	componentDidMount() {
		 
		this.typeChat = this.props.typeChat;	
		if (this.typeChat == 'videoChat') {
			window.addEventListener("resize", this.onResize);
		}
		this.setState ({isChat:'show'});
		if (!this.webSocket)
		{
			this.connect ();
		}			
	}

	componentWillUnmount() {
		if (this.typeChat=='videoChat') {
			window.removeEventListener("resize", this.onResize);
		}   
	}

	chatClose() {
		if (this.typeChat=='videoChat' && this.myPeerConnection) {
			this.setState ({closeMsg:'Закрыть видеочат и завершить видеосвязь?'});
		} else {

			if (this.webSocket !=null)
		    	this.webSocket.close ();	
		    clearInterval(this.checkAlive);
			this.setState ({isChat:'close'});			
		}		
	}

	onChangeText(event) {
		 this.setState({input_text: event.target.value});
	}

	onClickSend(event) {
		 var input_text = this.state.input_text;
		 var msg = {
		 	type: "message_touser",
		    text: input_text,
		    target:this.target_user,
		    from_user:this.props.user_name
		 };

		 if (input_text=='')
		 	return;

		 this.sendToServer(msg);
		 var chat_text = this.state.chat_text.map(txt_block=> {
		 	return txt_block;
		 });

		 var d = new Date();
		 var date = d.toLocaleDateString()+' '+d.toLocaleTimeString();

		 var txt_block = <span key={chat_text.length}><span className='chat_date'>{date}</span>
		 					  <span className='chat_send_txt'>{input_text}<br/></span>
		 				 </span>;
		 chat_text.push (txt_block);
         this.setState({chat_text: chat_text});
		 this.setState({input_text: ''});
	}

	handlerKey(event) {
		if (event.keyCode === 13 || event.keyCode === 14) {
		  this.onClickSend();
		}
	}

	log(text) {
		var time = new Date();

		console.log("[" + time.toLocaleTimeString() + "] " + text);
	}

	log_error(text) {
		var time = new Date();

		console.trace("[" + time.toLocaleTimeString() + "] " + text);
	}

	reportError(errMessage) {
		this.log_error(`Error ${errMessage.name}: ${errMessage.message}`);
	}

	sendToServer(msg) {
		var msgJSON = JSON.stringify(msg);

		this.log("Sending '" + msg.type + "' message: " + msgJSON);
		this.webSocket.send(msgJSON);
	}

	ReconnectChat(state) {
		if (state=='Да')
	    {
	    	this.log ("Переустановка websocket соединения  ..");
	    	if (this.webSocket !=null)
	    		this.webSocket.close ();
			this.connect ();
	    }	    
	}

	connect() {

		var scheme = "ws";
		var myHostname = this.props.ws_server;
//		var myHostname = window.location.hostname;
/*		if (!myHostname) {
	  		myHostname = "localhost";
		}*/
		console.log("Hostname: ", myHostname);

		if (document.location.protocol === "https:") {
		  	scheme += "s";
		}
	//	this.serverUrl = scheme + "://" + myHostname + ":8080";
		this.serverUrl = scheme + myHostname;
		console.log('Connecting to server: ',this.serverUrl);
		this.webSocket = new WebSocket(this.serverUrl);

		this.webSocket.onopen = this.onOpenConnection;
		this.webSocket.onmessage = this.onMessage;

	}

	onOpenConnection() {
		console.log ('connection_open ..');
		this.msg_connect.user_name = this.myUsername;
		if (this.msg_connect.user_name=='yarikfanat')
			this.msg_connect.func = 'trainer';
		else
			this.msg_connect.func = 'client';
		this.isAlive = true;

		this.webSocket.send(JSON.stringify(this.msg_connect));	
		this.checkAlive = setInterval (this.CheckConnection,15000);
		this.setState({state_class: 'state_indicator_on'});
	}

	onMessage(event) {
		var msg = JSON.parse(event.data);			

		switch(msg.type) {
			case "user_list":
				console.log ('получено сообщение ',msg.list);
		      	this.CreateUserList (msg.list);
		      	break;
			   
		    case "message":
		    	console.log ('получено сообщение от ',msg.from_user,'=>',msg.text);

		    	var space = ' ';
		    	var chat_text = this.state.chat_text.map(txt_block=> {
		    		return txt_block;
		    	});

				var receive_text = <span key={chat_text.length}><span className='chat_date'>{msg.date}</span><span className='chat_from_user'>{space}{msg.from_user}{'=> '}</span>
								   <span className='chat_receive_txt'>{msg.text}<br/></span></span>;
				chat_text.push (receive_text);
				this.setState({chat_text: chat_text});
			    break;

		    case "video-offer":  
		    	this.handleVideoOfferMsg(msg);
		    	break;

		    case "video-answer":  
		    	this.handleVideoAnswerMsg(msg);
	          	break;
		    case "new-ice-candidate": 
		    	this.handleNewICECandidateMsg(msg);
		      	break;

		    case "hang-up": 
		    	this.handleHangUpMsg(msg);
		      	break;
		     
		    case "ping_":
		    	this.sendToServer ({type:'pong_'});  	         
		      	break;
			case "ping":
			  	var d = new Date();
	          	var date = d.toLocaleDateString()+' '+d.toLocaleTimeString();
			  	this.isAlive=true;
			  	console.log (date,' получен ping от сервера <я жив>');
			  	break;	
		}

	}

	CreateUserList(user_list) {
		function getKey(str){
	      let key = 0;
	      for (let i = 0; i < str.length; i++) {
	        key += str.charCodeAt(i);
	      }
	      return key.toString();
	    }
	    this.target_user = null;
		const items = user_list.map((user,index) => {
      		const key = getKey(user);
      		if (!index)
      			this.target_user = user;
      		return <li key={key}>{user}</li>;
    	});
    	user_list.length>0? this.isControlsDisabled = false:this.isControlsDisabled = true;
    	if (this.typeChat=='videoChat')
    		this.setState ({target_user:this.target_user});
    	else
    		this.setState ({user_list:items});

	}

	CheckConnection() {
		var d = new Date();
		var date = d.toLocaleDateString()+' '+d.toLocaleTimeString();
			
		if (this.isAlive==true)
		{
			console.log (date,' checkAlive()=> соединение живое ');
			this.isAlive=false;

			console.log ('Отправляю pong серверу');
		    this.sendToServer ({type:'pong'});
		}else
		{
			console.log (date,' checkAlive()=> соединение умерло . Нужен reconnect');	
			this.msg_connect.user_name = null;	
			this.setState({state_class: 'state_indicator_off'})			
			clearInterval(this.checkAlive);
			this.log(`ReConnecting to server: ${this.serverUrl}`);
			if (this.webSocket !=null)
				this.webSocket.close ();
			this.connect ();
		}
	}

	videoCall() {
		if (this.myPeerConnection) {
			this.setState ({videoMsg:'Завершить текущий видеозвонок и перезапустить заново?'});
		} else
			this.invite();
	}

	reInvite(state) {
		if (state=='Да') {

			this.hangUpCall();
			this.invite();
		}
	}

	closeVideoChat(state) {
		if (state=='Да') {

			this.hangUpCall();
			this.chatClose();
		}
	}

	async invite() {
		if (this.msg_connect.user_name == null) {
			this.setState ({alertMsg:'Видеозвонок не возможен. Вы не подключены к серверу сигнализации'});
			return;
		}
		if (this.target_user == null) {
			this.setState ({alertMsg:'Видеозвонок не возможен. Нет подключенного собеседника'});
			return;
		}

		this.log("Стартую видеозвонок");
		 
		this.log("Inviting user " + this.target_user);
		this.log("Установка соединения с: " + this.target_user);
		this.createPeerConnection();

		try {
		    
		    this.webcamStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
		    this.localVideo.srcObject = this.webcamStream;
		} catch(err) {

		  this.handleGetUserMediaError(err);
		  return;
		}
		
		try {
			this.webcamStream.getTracks().forEach(
				track => this.myPeerConnection.addTransceiver(track, {streams: [this.webcamStream]})
		    );
		} catch(err) {

		  this.handleGetUserMediaError(err);
		}
	}

	async createPeerConnection() {
		this.log("Настройка соединения...");

		this.myPeerConnection = new RTCPeerConnection({
			iceServers: [     
					      	{ 	urls: ["stun:stun.stunprotocol.org","stun:stun1.l.google.com:19302","stun:stun2.l.google.com:19302",
									   "stun:stun4.l.google.com:19302","stun:stun.ekiga.net","stun:stun.ideasip.com","stun:stun.rixtelecom.se",
									   "stun:stun.schlund.de"] 
							},
						    {
						      	urls: "turn:192.158.29.39:3478?transport=udp", 
						      	credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=', 
					     		username: '28224511:1379330808' 
						    },
						    {
						    	urls: 'turn:numb.viagenie.ca',
		    					credential: 'muazkh',
		    					username: 'webrtc@live.com'
						    },
						    {
							    url: 'turn:turn.bistri.com:80',
							    credential: 'homeo',
							    username: 'homeo'
							},
							{
							    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
							    credential: 'webrtc',
							    username: 'webrtc'
							}
						]
					});
		this.myPeerConnection.onicecandidate = this.handleICECandidateEvent;
		this.myPeerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
		this.myPeerConnection.onicegatheringstatechange = this.handleICEGatheringStateChangeEvent;
		this.myPeerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
		this.myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent;
		this.myPeerConnection.ontrack = this.handleTrackEvent;
	}


	handleGetUserMediaError(e) {
		this.log_error(e);

		switch(e.name) {
		    case "NotFoundError":

		    	this.setState ({alertMsg:'Не могу начать видеозвонок, так как не обнаружены камера/микрофон'});
		      	break;
		    case "SecurityError":
		    case "PermissionDeniedError":

		      	break;
		    default:

		    	var msg = "Ошибка открытия вашей камеры/микрофона: " + e.message;
		    	this.setState ({alertMsg:msg});
		      	break;
		}

	  	this.closeVideoCall();
	}

	handleICECandidateEvent(event) {

		if (event.candidate) {
			this.log("*** Отправка ICE кандидатов: " + event.candidate.candidate);

			this.sendToServer({
				type: "new-ice-candidate",
				target: this.target_user,
				candidate: event.candidate,
				from_user: this.myUsername
			});
		}
	}

	handleTrackEvent(event) {

		this.log("*** Track event");
		this.receiveVideo.srcObject = event.streams[0];
	}

	async handleNegotiationNeededEvent() {

		this.log("*** Negotiation needed");

		try {

			this.log("---> Creating offer");
			const offer = await this.myPeerConnection.createOffer();

			if (this.myPeerConnection.signalingState != "stable") {

				this.log("-- The connection isn't stable yet; postponing...");
				return;
			}

			this.log("---> Setting local description to the offer");
			await this.myPeerConnection.setLocalDescription(offer);

			this.log("---> Отсылаю видео-предложение на удаленный узел");

			this.sendToServer({
				from_user: this.myUsername,
				target: this.target_user,
				type: "video-offer",
				sdp: this.myPeerConnection.localDescription
			});
		} catch(err) {

			this.log("*** The following error occurred while handling the negotiationneeded event:");
			this.reportError(err);
		}
	}

	handleICEConnectionStateChangeEvent(event) {

		this.log("*** ICE connection state changed to " + this.myPeerConnection.iceConnectionState);

		switch(this.myPeerConnection.iceConnectionState) {
			case "closed":
			case "failed":
			case "disconnected":

				this.closeVideoCall();
				break;
		}
	}

	handleSignalingStateChangeEvent(event) {

		this.log("*** WebRTC signaling state changed to: " + this.myPeerConnection.signalingState);

		switch(this.myPeerConnection.signalingState) {

			case "closed":

				this.closeVideoCall();
				break;
		}
	}

	handleICEGatheringStateChangeEvent(event) {

		this.log("*** ICE gathering state changed to: " + this.myPeerConnection.iceGatheringState);

		if (this.myPeerConnection.iceGatheringState=='complete') {
			var aspectRatio = this.videoWidth/this.videoHeight;
			if (aspectRatio.toFixed(1)!=1.3)
				this.applyAspectRatio ();
		}
	}

	closeVideoCall() {

		this.log("Closing the call");

		if (this.myPeerConnection) {

			this.log("--> Closing the peer connection");
			this.myPeerConnection.ontrack = null;
			this.myPeerConnection.onnicecandidate = null;
			this.myPeerConnection.oniceconnectionstatechange = null;
			this.myPeerConnection.onsignalingstatechange = null;
			this.myPeerConnection.onicegatheringstatechange = null;
			this.myPeerConnection.onnotificationneeded = null;

			this.myPeerConnection.getTransceivers().forEach(transceiver => {
				transceiver.stop();
			});

			if (this.localVideo.srcObject) {

				this.localVideo.pause();
				this.localVideo.srcObject.getTracks().forEach(track => {
					track.stop();
				});
			}

			this.myPeerConnection.close();
			this.myPeerConnection = null;
			this.webcamStream = null;
		}
	}

	async handleVideoOfferMsg(msg) {

		this.log("Received video chat offer from " + msg.from_user);
		if (!this.myPeerConnection) {

			this.createPeerConnection();
		}

		var desc = new RTCSessionDescription(msg.sdp);

		if (this.myPeerConnection.signalingState != "stable") {

			this.log("  - But the signaling state isn't stable, so triggering rollback");
			await Promise.all([

				this.myPeerConnection.setLocalDescription({type: "rollback"}),
				this.myPeerConnection.setRemoteDescription(desc)
				]);

			return;

		} else {

			this.log ("  - Setting remote description");
			await this.myPeerConnection.setRemoteDescription(desc);
		}

		if (!this.webcamStream) {

			try {

				this.webcamStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
			} catch(err) {

				this.handleGetUserMediaError(err);
				return;
			}

			this.localVideo.srcObject = this.webcamStream;
			try {

				this.webcamStream.getTracks().forEach(
					track => this.myPeerConnection.addTransceiver(track, {streams: [this.webcamStream]})
					);

			} catch(err) {

				this.handleGetUserMediaError(err);
			}
		}

		this.log("---> Отправка видео-ответа вызывающему");
		await this.myPeerConnection.setLocalDescription(await this.myPeerConnection.createAnswer());

		this.sendToServer({
			from_user: this.myUsername,
			target: this.target_user,
			type: "video-answer",
			sdp: this.myPeerConnection.localDescription
		});
	}

	async handleVideoAnswerMsg(msg) {

		this.log("*** Call recipient has accepted our call");

		var desc = new RTCSessionDescription(msg.sdp);
		await this.myPeerConnection.setRemoteDescription(desc).catch(this.reportError);
	}

	async handleNewICECandidateMsg(msg) {
		var candidate = new RTCIceCandidate(msg.candidate);

		this.log("*** Добавляю принятых ICE кандидатов: " + JSON.stringify(candidate));
		try {

			await this.myPeerConnection.addIceCandidate(candidate)
		} catch(err) {
			this.reportError(err);
		}
	} 

	handleHangUpMsg(msg) {
		var closeMsg = this.target_user+' завершил видеосвязь. Закрыть видеочат?';

		this.log("*** Принято hang up сообщение от удаленного узла");
		this.closeVideoCall();
		this.setState ({closeMsg:closeMsg});
	}

	hangUpCall() {
		var msg={
			from_user: this.myUsername,
			target: this.target_user,
			type: "hang-up"
		};

		this.closeVideoCall();
		this.sendToServer(msg);
	}

	applyAspectRatio () {
		var supports = navigator.mediaDevices.getSupportedConstraints();
		
		console.log ('supports contraints->',supports);
		if (!supports["width"]) {

			console.log ('getSupportedConstraints() :ограничение ["width"] не поддерживается ');
			return ;
		}
		
		console.log ('Установка  параметров <Receive видео> :width=',this.videoWidth,' height=',this.videoHeight);
		try {
				this.receiveVideo.srcObject.getVideoTracks().forEach((track)=> {
					track.applyConstraints({
						width: {ideal:this.videoWidth},
						height: {ideal:this.videoHeight},
					})
					.then (()=> {
						console.log ('Sucessfull applyConstraints width=',this.videoWidth,'Height=',this.videoHeight);

					})
					.catch (e => {
						console.log ('The constraints could not be satisfied by the available devices');
	    					// The constraints could not be satisfied by the available devices.
	  				});

				});
		} catch (err) {

			console.error('Ошибка при установке новых настроек экрана Receive видео->', err.message);
		}
	}

	render() {
		var state_msg,state_msg2;
		var chatbox;
		var user_list = this.state.user_list;
		var chat_text = this.state.chat_text;
		var chat_class;

		if (this.typeChat=='textChat') 
			chat_class='chat_container';
		else
			chat_class='video_chat_container';

		if (this.state.isChat=='show') {
			chat_class += ' animate__animated animate__bounceInLeft';
		} 
		if (this.state.isChat=='close') {
			chat_class += ' animate__animated animate__rotateOut';
		}
		(this.state.state_class=='state_indicator_on')?state_msg = 'Соединение активно':state_msg = 'Соединение не активно';
		(this.state.state_class=='state_indicator_on')?state_msg2 = 'Активно':state_msg2 = 'Не активно';

		if (this.typeChat=='textChat') {
			
			chatbox = <div className='modal_chat'>
						<div className={chat_class} onAnimationEnd={this.AnimationEnd}>
							<div className='chat_upper_panel'>
								<div className='upper_panel_name'>Текстовый чат</div>
								<div className='upper_panel_close' onClick={this.chatClose}>
									<div className='button_close'>X</div>
								</div>
							</div>
			        		<div className='chat_header_container'>
			        			<div className='chat_head'>Чат</div>
			        			<div className='users_head'>Пользователи</div>
			        		</div>
			        		<div className='chat_box_container'>
			        			<div className='chat_head_'>Чат</div>
			        			<ChatBox>{chat_text}</ChatBox>
			        			<div className='users_head_'>Пользователи</div>
			        			<UserListBox>{user_list}</UserListBox>
			        		</div>
			        		<div className='chat_controls_container'>			        			
			        			<fieldset className='state_network'>
   									<legend>Состояние сети</legend>
   									<div className='state_block'>
   										<div id='st1'>Чат:</div><div className={this.state.state_class}></div><div>{state_msg}</div>
   									</div>
   									<div className='state_control'>
   										<input type="button" name="socketReconnect" value="Reconnect chat" id='reconnect' 
									   		onClick={()=>{this.setState({Msg:'Сбросить текущее websocket соединение и установить заново?'});}} />
   									</div>
   								</fieldset>
			        			<div className='send_controls'>
			        				<input type="text" name="text" size="100" maxLength="256" value={this.state.input_text} onChange={this.onChangeText} placeholder="Здесь набирается текст ..." 
									  	id="text_chat" autoComplete="off" onKeyUp={this.handlerKey} disabled={this.isControlsDisabled} />
									<input type="button" name="send" value="Send" id="send" onClick={this.onClickSend} disabled={this.isControlsDisabled} />
			        			</div>
			        		</div>
			        	</div>
					  </div>;

		}	 
		if (this.typeChat=='videoChat') {
			
			var dock_panel_class = 'video_dock_panel';

			if (this.state.isDockPanel && this.state.isDockPanel!=' ') {
				(this.state.isDockPanel=='undock')?dock_panel_class+=' animate__animated animate__backOutUp':dock_panel_class+=' animate__animated animate__bounceInDown';
			}

			var dock_panel = <div className={dock_panel_class} onAnimationEnd={this.AnimationEndDock}>
								<fieldset className='video_control_block'>
									<legend>Состояние сети</legend>
									<div className='button_network' onClick={()=>{this.setState({Msg:'Сбросить текущее websocket соединение и установить заново?'});}}>
										<div className={this.state.state_class}></div><div id='st3'>{state_msg}</div><div id='st2'>{state_msg2}</div>
									</div>
									<div className='button_video_call' onClick={this.videoCall}>
										<img src='img/video_call.png' className='video_call'/>
									</div>
									<div className='button_hide_panel' onClick={this.undockVideoPanel}>
										<img src='img/undock_panel.png' className='video_undock_panel'/>
									</div>
									<div className='user_name_container'>
										<img src='img/abonent-26.png' />
										<span>{this.state.target_user}</span>
									</div>
								</fieldset>
							</div>;

			chatbox =  <div className='modal_chat'>
							<div className={chat_class} onAnimationEnd={this.AnimationEnd}>
								<div className='video_chat_upper_panel'>
									<div className='video_upper_panel_name'>Видео чат</div>
									<div className='video_control_panel'>
										<div className='video_panel_close' onClick={this.dockVideoPanel}>
											<img src='img/panel_video.png' className='video_panel_dock' />
										</div>
										<div className='video_close' onClick={this.chatClose}>X</div>
									</div>
								</div>
								<div className='video_container'>
									<video className='receive_video' autoPlay ref={(video)=>{this.receiveVideo = video;}} />
									<video id='local_video'autoPlay ref={(video)=>{this.localVideo = video;}}/>
									{
										this.state.isDockPanel?dock_panel:null
									}
								</div>								
							</div>
					   </div>;
		}
		
		var msgBox = <MessageBox type='confirm' effect='backInLeft' render={(state)=>{this.setState ({Msg:null});this.ReconnectChat(state);}} effectOut='zoomOutRight'>{this.state.Msg}</MessageBox>;
		var videoMsg = <MessageBox type='confirm' effect='backInLeft' render={(state)=>{this.setState ({videoMsg:null});this.reInvite(state);}} effectOut='zoomOutRight'>{this.state.videoMsg}</MessageBox>;
		var closeMsg = <MessageBox type='confirm' effect='backInLeft' render={(state)=>{this.setState ({closeMsg:null});this.closeVideoChat(state);}} effectOut='zoomOutRight'>{this.state.closeMsg}</MessageBox>;

		return(
			<div>
				{
					this.state.isChat?chatbox:null
				}				
				{
	    			this.state.Msg?msgBox:null
	    		}
	    		{
	    			this.state.videoMsg?videoMsg:null
	    		}
	    		{
	    			this.state.closeMsg?closeMsg:null
	    		}
	    		{
	    			this.state.alertMsg?<MessageBox type='alert' effect='rubberBand' render={()=>{this.setState({alertMsg:null})}} effectOut='rotateOut'>{this.state.alertMsg}</MessageBox>:null
	    		}	    		
			</div>
		);
	}
}

export default ChatContainer