import React, {Component} from 'react'
import {MessageBox} from './start'
import ChatContainer from './chat'
import './css/trainer.css'

function Passport(props) {
	function ClickPhoto(event) {
		props.ClickPhoto(props.indexLevel,event.clientX,event.clientY);
	}
	return <div className='passe-partout' onClick={ClickPhoto}>{props.children}</div>;
}

function BlockExercise(props) {
	return <div className='block_main_ex'>{props.children}</div>;
}

function Equipments(props) {
	return <div className='equipment'>{props.children}</div>;
}

function WrapColumn(props) {
	return <div className='wrap_column'>{props.children}</div>;
}

function MainExercise(props) {
	var level = props.indexLevel;

	function ShowPhoto() {
		props.ShowPhoto (level,props.complex_photos[0],props.complex_details[0],props.src_video[0]);
	}

	return <div className="exercise_name" onClick={ShowPhoto}>{props.children}</div>
}

function AddExercise(props) {
	var level = props.level;
	var number = props.number;
	var animation = props.animation;
	var last_element = props.last;

	function ShowPhoto() {
		props.ShowPhoto (level,props.complex_photos[number],props.complex_details[number],props.src_video[number]);
	}

	function Animationend() {
		props.DeleteMoreExercises (level);//для мобильных устройств
	}

	if (animation == 'hide')
		return <li onAnimationEnd={last_element?Animationend:null} className='animation_lists_hide'>{props.children}</li>;
	return <li className='animation_lists_show' onClick={ShowPhoto} >{props.children}</li>;
}

function AlternativeExercises(props) {

	function getKey(str){
      let key = 0;
      for (let i = 0; i < str.length; i++) {
        key += str.charCodeAt(i);
      }
      return key.toString();
    }

    var level = props.indexLevel;
    var animation = props.animation;
    const list = props.exercises;
    var i = 0;
    var last = list.length-1;

    const items = list.map((exercise) => {
      const key = getKey(exercise)

      return <AddExercise 
      			last={i==last? true:false} level={level} number={i++} animation={animation} DeleteMoreExercises={props.DeleteMoreExercises} 
      		 	ShowPhoto={props.ShowPhoto} src_video={props.src_video} complex_photos={props.complex_photos} complex_details={props.complex_details} key={key}> 
      		 	{exercise}
      		 </AddExercise>;
    });
    items.splice (0,1);

    return (<ul className="list_exercise">{items}</ul>);
}

function CreateTrainComponents(props) {
	var Exercises;
	var rows=[];
	var columns=[];
	var complex = props.complex;
	var photos = props.photos;
	var details = props.details;
	var buttonShow = props.buttonShow;
	var moreExercises = props.moreExercises;
	var key=0;

	photos.map ((photo,index)=>  {
		let passport = <Passport 
							ClickPhoto={props.ClickPhoto} indexLevel={index}>
							<img src={photo} className='photo_equip'/>
							<div className='info'>{details[index].rounds}x{details[index].reps}</div>
					   </Passport>;
		let block = <BlockExercise>
					<ButtonShow onButtonShowHadler={props.onButtonShowHadler} indexLevel={index}>{buttonShow[index]}</ButtonShow>
					<MainExercise 
						ShowPhoto={props.ShowPhoto} src_video={complex.src_video[index]} complex_details={complex.details[index]} complex_photos={complex.photo_equip[index]} 
						indexLevel={index}>{complex.exercise_name[index][0]}
					</MainExercise>
					</BlockExercise>;
		if (moreExercises[index]!=null)
			Exercises = <AlternativeExercises 
							DeleteMoreExercises={props.DeleteMoreExercises} animation={moreExercises[index]} indexLevel={index} src_video={complex.src_video[index]}
							exercises={complex.exercise_name[index]} ShowPhoto={props.ShowPhoto} complex_details={complex.details[index]} complex_photos={complex.photo_equip[index]}
						/>
		else
			Exercises = null;
		columns.push (<Equipments key={++key}>{passport}{block}{Exercises}</Equipments>);
	});

	var prev = null;
	var count = 0;
	columns.map((column) => {
		++count;
		if (!prev)
			prev = column;
		if (count==2) {
			rows.push (<WrapColumn key={++key}>{prev}{column}</WrapColumn>);
			prev = null;
			count = 0;
		}			
	});
	if (prev)
		rows.push (<WrapColumn key={++key}>{prev}</WrapColumn>);

	return (<div>{rows}</div>);
}

class ButtonShow extends Component {
	constructor(props) {
		super(props);
		this.onChangeState = this.onChangeState.bind(this);
	}

	onChangeState(event) {
		var level = this.props.indexLevel;
		this.props.onButtonShowHadler (level);
	}

	render() {

		return (
			<div>
				<button className="button_list_ex" onClick={this.onChangeState}><b>{this.props.children}</b></button>
			</div>
		);
	}
}

class HeadBar extends Component {
	constructor(props) {
      super(props);
      this.state = {isMsg:null,isChatBox:false};
      this.typeChat = '';
      this.onClickPlay = this.onClickPlay.bind(this);
      this.onChatBox = this.onChatBox.bind(this);
      this.onVideoChatBox = this.onVideoChatBox.bind(this);
    }

    onChatBox() {
    	this.typeChat = 'textChat';
    	this.setState ({isChatBox:true});
    }

    onVideoChatBox() {
    	this.typeChat = 'videoChat';
    	this.setState ({isChatBox:true});
    }

    onClickPlay() {
    	if (this.props.video==null)
    		this.setState ({isMsg:'Сначала выберите упражнение для просмотра видео'});
    	else
    	if (this.props.video=='')
    		this.setState ({isMsg:'Видеоролик не добавлен администратором'});
    	else
    		this.props.PlayVideo();
    }

	render() {
		var player_class,class_webcam;
		var player = this.props.player;
		var user_name = this.props.user_name;
		var ws_server = this.props.ws_server;

		if (player)
		{	
			(player=='show')?player_class='video_player animation_player_show':player_class='video_player animation_player_hide';
		}else
			player_class = 'video_player';

		return (
			<div className='header_back'>
				{
					(this.props.video!='')?
						<iframe src={this.props.video} className={player_class} title="YouTube video player" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
						allowFullScreen/>:null
				}
				<div className="header">				
					<div className='controls_container'>
						<div className='wrap_control' onClick={this.onChatBox}><img className='chatBox' src='img/chat-box.png'/></div>
						<div className='wrap_control' onClick={this.onClickPlay}><img id='youtube' src='img/youtube.png'/></div>
						<div className='wrap_control' onClick={this.onVideoChatBox}><img className='webCam' src='img/webcam96_off.png'/></div>
					</div>
				</div>
				{
    				this.state.isMsg?<MessageBox type='alert' effect='rubberBand' render={()=>{this.setState({isMsg:null})}} effectOut='rotateOut'>{this.state.isMsg}</MessageBox>:null
    			}
    			{
    				this.state.isChatBox?<ChatContainer typeChat={this.typeChat} user_name={user_name} ws_server={ws_server} render={()=>{this.setState({isChatBox:null})}}/>:null
    			}
			</div>
		);
	} 	   	    	
}

class ToolTip extends Component {
	constructor(props) {
		super(props);
		this.state = {toolTip:null};
		this.out = false;
		this.tool_class='';

		this.clickHandler = this.clickHandler.bind(this);
		this.AnimationEnd = this.AnimationEnd.bind(this);
	}

	AnimationEnd() {
		if (this.out)
			this.props.render();
	}

	componentDidMount() {
		this.tool_class = 'weight animate__animated animate__' + this.props.effect;
		this.setState ({toolTip:true});
	}

	clickHandler () {
		this.tool_class = 'weight animate__animated animate__' + this.props.effectOut;
		this.out = true;
		this.setState ({toolTip:true});
	}

	render () {
	
		return (
			<div>
			{
				this.state.toolTip?
				<div className={this.tool_class} style={{left:this.props.posX,top:this.props.posY}} onClick={this.clickHandler} onAnimationEnd={this.AnimationEnd}>
					<div className='weight_text'>{this.props.children}</div>
				</div>:null
			}				
			</div>
		);
	}
}

class TrainExercise extends Component {
	constructor(props) {
		super(props);
		this.state = {photos:[],buttonShow:[],moreExercises:[],details:[],video:null,player:null,chat:null,headBarVisible:true,toolTip:false};
		this.arrayVideo = [];
		this.posX=0;
		this.posY=0;

		this.onButtonShowHadler = this.onButtonShowHadler.bind(this);
		this.onChatHandler = this.onChatHandler.bind(this);
		this.DeleteMoreExercises = this.DeleteMoreExercises.bind(this);
		this.ShowPhoto = this.ShowPhoto.bind(this);
		this.PlayVideo = this.PlayVideo.bind(this);
		this.ClickPhoto = this.ClickPhoto.bind(this);
		this.setVisibleHeadBar = this.setVisibleHeadBar.bind(this);
	}

	setVisibleHeadBar(visible) {
		this.setState ({headBarVisible:visible});
	}

	onChatHandler() {
		var chat = this.state.chat;
	
		if (chat==null || chat=='hide')	
		{
			chat = 'show';
		}						
		else
		{
			chat = 'hide';
		}
		this.setState ({chat:chat});
	}

	ClickPhoto(index,posX,posY) {
		var tooltip;
		var video = this.arrayVideo[index];

		this.posX = posX-100;
		this.posY = posY-75;
		video==''?tooltip=false:tooltip=true;
		this.setState ({video:video,toolTip:tooltip});
	}

	PlayVideo() {
		var video = this.state.video;
		var player = this.state.player;

		if (player==null || player=='hide')
			player = 'show';
		else
			player = 'hide';
		this.setState ({player:player});
	}

	ShowPhoto(index,photo,detail,src_video) {
		var photos = this.state.photos;
		var details = this.state.details;

		photos[index] = photo;
		details[index] = detail;
		this.arrayVideo[index] = src_video;
		this.setState ({photos:photos,details:details,video:src_video});
	}

	DeleteMoreExercises(level) {
		var moreExercises = this.state.moreExercises;
		var photos = this.state.photos;
		var details = this.state.details;
		var complex = this.props.complex;

		moreExercises[level] = null;
		photos[level] = complex.photo_equip[level][0];
		details[level] = complex.details[level][0];
		this.setState ({photos:photos,moreExercises:moreExercises,details:details});
	}

	onButtonShowHadler(level) {
		var buttonShow = this.state.buttonShow;
		var moreExercises = this.state.moreExercises;
		if (buttonShow[level]=='-')
		{
			buttonShow[level] = '+';
			moreExercises[level] = 'hide';
		}
		else 
		{
			buttonShow[level] = '-';
			moreExercises[level] = 'show';
		}

		this.setState ({buttonShow:buttonShow,moreExercises:moreExercises});
	}

	componentDidMount() {
		var buttonShow = [];
		var moreExercises = []; 
		var details = [];
		var complex = this.props.complex;

		var photos = complex.photo_equip.map((photos,index)=> {
			buttonShow.push ('+');
			moreExercises.push (null);
			details.push (complex.details[index][0]);
			this.arrayVideo.push (complex.src_video[index][0]);
			return photos[0];
		});
		this.setState ({photos:photos,buttonShow:buttonShow,moreExercises:moreExercises,details:details});
	}

	render() {
		var complex = this.props.complex;
		var user_name = this.props.user_name;
		var photos = this.state.photos;
		var video = this.state.video;
		var buttonShow = this.state.buttonShow;
		var moreExercises = this.state.moreExercises;
		var details = this.state.details;
		var player = this.state.player;
		//var chat = this.state.chat;
		
		return (					
			<div>
				{
					this.state.headBarVisible?<HeadBar user_name={user_name} video={video} player={player} PlayVideo={this.PlayVideo} ws_server={this.props.ws_server} />:null
				}
				
				<div className='full_wrap'>					
					<CreateTrainComponents 
						DeleteMoreExercises={this.DeleteMoreExercises} onButtonShowHadler={this.onButtonShowHadler} moreExercises={moreExercises} buttonShow={buttonShow} photos={photos} 
						complex={complex} ShowPhoto={this.ShowPhoto} details={details} ClickPhoto={this.ClickPhoto} 
					/>
					<div className='empty' />
				</div>
				{
					this.state.toolTip?<ToolTip posX={this.posX} posY={this.posY} effect='rotateIn' effectOut='rotateOut' render={()=>{this.setState({toolTip:false});}}>
					Для просмотра ролика нажмите кинокамеру</ToolTip>:null
				}
			</div>
		);
	}
}
export default TrainExercise