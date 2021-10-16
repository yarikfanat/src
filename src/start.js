import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import TrainExercise from './trainer'
import {
  isDesktop,
  isIE,
  isEdge
} from "react-device-detect";
import './css/start.css'
import './css/landscape1000.css'
import './css/landscape.css'

class MessageBox extends Component {
   constructor(props) {
      super(props);
      this.state = {showBox:false,boxPos:{}};
      this.class_box = 'msg_box';
      this.isCloseState = null;
      this.isDownMouse = false;
      this.delta = {};

      this.AnimationEnd = this.AnimationEnd.bind(this);
      this.ClickButton = this.ClickButton.bind(this);
      this.handleMouseDown = this.handleMouseDown.bind(this);
      this.handleMouseUp = this.handleMouseUp.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
    }

    AnimationEnd() { 
      this.class_box = 'msg_box';
      if (this.isCloseState)
        this.props.render(this.isCloseState);
    }

    componentDidMount() {
      if (typeof this.props.effect!='undefined') {
        this.class_box += ' animate__animated animate__' + this.props.effect;
      }
      this.setState ({showBox:true});
    }

    componentDidUpdate(prevProps) {
       if (this.isCloseState && (isIE || isEdge)) {
          setTimeout (()=>{this.props.render(this.isCloseState);},1500);
       }
    }

    ClickButton(event) {
      if (typeof this.props.effectOut!='undefined') {

        this.isCloseState = event.target.textContent;
        this.class_box += ' animate__animated animate__' + this.props.effectOut;
        this.setState ({showBox:true});

      }else

      this.props.render(event.target.textContent);
    }

    handleMouseDown(event) {
      var rect=this.msgBox.getBoundingClientRect();
      
      this.delta = {left:event.clientX-rect.left,top:event.clientY-rect.top};
      this.isDownMouse = true ; 
    }

    handleMouseUp() {
      this.isDownMouse = false ;
    }

    handleMouseMove(event) {
      if (this.isDownMouse) {
        var left = event.clientX-this.delta.left;
        var top = event.clientY-this.delta.top;

        this.class_box = 'msg_box1';
        this.setState({boxPos:{left:left,top:top}});
      }
    }

    render() {
      var buttons,box;

      if (this.props.type=='confirm') {

        buttons = <div className='container_buttons'><button className='button_yes' onClick={this.ClickButton}>Да</button>
                  <button className='button_no' onClick={this.ClickButton}>Нет</button></div>;  
      } else
        buttons = <div className='container_button'><button onClick={this.ClickButton}>Ok</button></div>;

      box = <div className={this.class_box} style={this.state.boxPos} onAnimationEnd={this.AnimationEnd} ref={(box)=>{this.msgBox=box;}}>
                <div className='upper_panel' onMouseDown={this.handleMouseDown} >Внимание</div>
                <div className='container_text'>{this.props.children}</div>
                {buttons}
            </div>;

      return(
        <div className='modal' onMouseMove={this.handleMouseMove} onMouseUp={this.handleMouseUp}>
        {
          this.state.showBox?box:null
        }
        </div>
        );
    }
}


class ClipsAnimation extends Component {
   constructor(props) {
      super(props);
      this.state = {arrayClips:[]};
      this.arrayImage = [{front_video:'clips/1.mp4',back_video:'clips/6.mp4'},
                         {front_video:'clips/2.mp4',back_video:'clips/7.mp4'},
                         {front_video:'clips/3.mp4',back_video:'clips/8.mp4'},
                         {front_video:'clips/4.mp4',back_video:'clips/9.mp4'},
                         {front_video:'clips/5.mp4',back_video:'clips/10.mp4'},
                         {front_video:'clips/1.mp4',back_video:'clips/6.mp4'}
                        ];
      this.animation = {reverseIn:'animate__flipInY',reverseOut:'animate__flipOutY',delayIn:'animate__delay-0s',delayOut:'animate__delay-0s'};                    
      this.createClip = false;
      this.front_video_reverse=null;
      this.back_video_reverse=null;
      this.indexReverse=0;//IE
      this.arrayVideo = [];
      this.lastVideo=null;
      this.interval = null;

      this.shiftClips = this.shiftClips.bind(this);
      this.createArrayClips = this.createArrayClips.bind(this);
      this.ReverseClip = this.ReverseClip.bind(this);
      this.PlayVideo = this.PlayVideo.bind(this);
      this.PlayVideo_ = this.PlayVideo_.bind(this); //IE
      this.reInitClips = this.reInitClips.bind(this);
    }

    shiftClips() {
      this.arrayImage.shift();
      this.arrayImage[this.arrayImage.length] = this.arrayImage[0];

      this.arrayVideo.forEach((video,index)=> {
        var class_clip = 'animation_clip'+(index+1);
        var list = video.classList;

        for (var i = 0; i < list.length; i++) {
          if (list[i].indexOf('animation_clip') != -1)
            video.classList.remove (list[i]);
        }

        video.classList.remove(this.animation.reverseIn);
        video.classList.remove(this.animation.delayIn);
        
        video.classList.add (class_clip);
      });
      this.lastVideo = this.arrayVideo.shift();     
      this.arrayVideo[this.arrayVideo.length] = this.lastVideo;    

      if ((isIE || isEdge) && isDesktop) {

         this.interval = setTimeout (()=>{this.reInitClips();},3000);
      }  
    }

    reInitClips() {
      var last_index = this.arrayImage.length-1;            

      this.arrayVideo[last_index].src = this.arrayImage[0].front_video;
      this.arrayVideo.forEach((video,index)=> {
        var list = video.classList;

        for (var i = 0; i < list.length; i++) {
          if (list[i].indexOf('clip') != -1 && list[i].startsWith('clip'))
            video.classList.remove (list[i]);
        }      
        video.classList.add('clip'+(index+1));

        for (var i = 0; i < list.length; i++) {
          if (list[i].indexOf('animation_clip') != -1)
            video.classList.remove (list[i]);
        }
      });

      if ((isIE || isEdge) && isDesktop) {
        this.PlayVideo_(this.indexReverse);
      }
    }

    PlayVideo_(index) {
  
      this.interval = setTimeout (()=>{this.ReverseClip(index,this.animation.reverseOut, this.animation.delayOut);},10000);
    }

    PlayVideo(index) {
      this.arrayVideo[index].play()
        .then(()=> {
            var promise = new Promise((myResolve)=> {

            this.interval = setTimeout (()=>{myResolve();},10000);
          })
          .then(()=> {
              var promise = new Promise((myResolve)=> {

                this.arrayVideo[index].onanimationend = ()=> {                   
                  myResolve();
                };
                this.ReverseClip(index,this.animation.reverseOut, this.animation.delayOut);

              })
              .then(()=> {
                  var promise = new Promise((myResolve)=> {
                    
                    this.arrayVideo[index].onanimationend = ()=> {
                      myResolve();
                    };

                    this.arrayImage[index].front_video = this.back_video_reverse;
                    this.arrayImage[index].back_video = this.front_video_reverse;
          
                    this.arrayVideo[index].src = this.arrayImage[index].front_video;
                                       
                    this.ReverseClip(index,this.animation.reverseIn, this.animation.delayIn);
                  })
                  .then(()=> {
                    this.arrayVideo[index].play()
                      .then(()=> {
                          var promise = new Promise((myResolve)=> {

                          this.interval = setTimeout (()=>{myResolve();},10000);
                        })
                        .then(()=>{
                           var promise = new Promise((myResolve)=> {

                            this.arrayVideo[index].onanimationend = ()=> {
                              myResolve();
                            };
                            var last_index = this.arrayImage.length-1;
                            this.arrayVideo[last_index].src = this.arrayImage[0].front_video;
                            this.shiftClips();
                          })
                          .then(()=> {
                            this.reInitClips();
                            this.PlayVideo(index);
                          });
                        });
                      });
                  });
              });
          });            
        });
    }

    createArrayClips() {
      var autoplay = false;
      var loop = false; 

      if ((isIE || isEdge) && isDesktop) {
          autoplay = true;
          loop = true;
      } 

       var arrayClips = this.arrayImage.map((img,index) => {
        var class_clip = 'video_img clip'+(index+1)+' animate__animated';  
        
        return <video key={index} className={class_clip} autoPlay={autoplay} loop={loop} muted src={img.front_video} ref={(video)=>{this.video=video;this.arrayVideo[index]=this.video;}}/>;
      });
      this.createClip = true;
      this.setState ({arrayClips:arrayClips});
    }

    ReverseClip(indexReverse,effect,delay) {
      this.indexReverse = indexReverse;
   
      this.front_video_reverse = this.arrayImage[indexReverse].front_video;
      this.back_video_reverse = this.arrayImage[indexReverse].back_video;

      
      this.arrayVideo[indexReverse].classList.remove(this.animation.reverseIn);
      this.arrayVideo[indexReverse].classList.remove(this.animation.reverseOut);     
      this.arrayVideo[indexReverse].classList.remove(this.animation.delayOut);
      this.arrayVideo[indexReverse].classList.remove(this.animation.delayIn);

      this.arrayVideo[indexReverse].classList.add(effect);
      this.arrayVideo[indexReverse].classList.add(delay);

       if ((isIE || isEdge) && isDesktop) {
        if (effect.indexOf('Out') != -1) {

          this.arrayImage[this.indexReverse].front_video = this.back_video_reverse;
          this.arrayImage[this.indexReverse].back_video = this.front_video_reverse;
          
          this.interval = setTimeout (()=>{

            this.arrayVideo[this.indexReverse].src = this.arrayImage[this.indexReverse].front_video;
            
          },500);
          this.interval = setTimeout (()=>{
            
            this.ReverseClip(indexReverse,this.animation.reverseIn,this.animation.delayIn);
            
          },1000);

        } else {

          var last_index = this.arrayImage.length-1;

          this.arrayVideo[last_index].src = this.arrayImage[0].front_video;
          this.interval = setTimeout (()=>{this.shiftClips();},10000);
        }
       }
    }

    componentDidMount() {
      if ((isIE || isEdge) && !isDesktop)
        return;
      this.createArrayClips();
    }

    componentWillUnmount() {
      if (!(isIE || isEdge)) {

        this.arrayVideo.forEach((video,index)=> {
          video.onanimationend = null;
        });
      }
      
      clearTimeout(this.interval);
    }

    componentDidUpdate(prevProps) {
      if (this.createClip) {

        this.createClip = false;
        if (isIE || isEdge) {
          if (isDesktop)
            this.PlayVideo_(0);//IE
        }
        else
          this.PlayVideo(0); 
      }
    }

    render() {
      return (
        <div className='video_block'>                  
          {
            
            this.state.arrayClips
          }                   
        </div>
      );
    }
}

function Lenta(props) {
  var class_lenta;
  var array_win = [];
  var array_win_ = [];

  for (var i = 0; i <= 34; i++) {
    array_win.push(<div key={i} className='lenta_win'/>);
  }
  for (var i = 0; i <= 18; i++) {
    array_win.push(<div key={i+35} className='lenta_win_'/>);
  }

  props.pos=='up'?class_lenta='lenta':class_lenta='lenta2';

  return <div className={class_lenta}>{array_win}{array_win_}</div>;
}

function BackImage(props) {
	if (typeof props.width!='undefined' && typeof props.height!='undefined')
		return <img src={props.photo_src} width={props.width} height={props.height} className={props.class_name} alt='' />
	return <img src={props.photo_src} className={props.class_name} alt='' />
}

function AnimationText(props) {
	return <div className={props.class_name} id={props.text_id}>{props.children}</div>;
}

function AnimationHead() {
	return (
		<div className='name_head'>
			<AnimationText class_name='name_head1 animate__animated animate__bounceInLeft animate__delay-1s animate__slow' text_id='head_name1'>Тренер</AnimationText>
			<AnimationText class_name='name_head2 animate__animated animate__bounceInRight animate__delay-1s animate__slow' text_id='head_name2'>онлайн</AnimationText>
		</div>
	);
}

function FormEntry(props) {
	return (
		<div className={props.class_name} id={props.form_id}>
			<div className="my_logo">Copyright Бойчук Ярослав</div>
			<InputsBlock onLogon={props.onLogon} onSaveData={props.onSaveData} isSaveData={props.isSaveData} />
		</div>
	);
}

class InputsBlock extends Component {
	 constructor(props) {
      super(props);
      this.state = {login: '', password: ''};

      this.onChangeLogin = this.onChangeLogin.bind(this);
      this.onChangePassword = this.onChangePassword.bind(this);
      this.onClickHandler = this.onClickHandler.bind(this);     
      this.handlerKey = this.handlerKey.bind(this);
    }

    onChangePassword(event){
      this.setState({password: event.target.value});
    }

    onChangeLogin(event) {
      this.setState({login: event.target.value});
    }

    onClickHandler(event) {     
   	  this.props.onLogon ({user_name:this.state.login,password:this.state.password});
    }

    handlerKey(event) {
      if (event.keyCode === 13 || event.keyCode === 14) {
		  this.onClickHandler();
	  }
}

	render() {

		return (
			<div className="input_block">
				<p><b>Введите имя пользователя:</b></p>
				<input type="text" id="usr" value={this.state.login} onChange={this.onChangeLogin} />
				<p><b>Введите пароль:</b></p>
				<input type="password" id="pass" value={this.state.password} onChange={this.onChangePassword} onKeyUp={this.handlerKey} />
				<input type="button" id="btn" value="Подтвердить" onClick={this.onClickHandler} />
				<p><input type="checkbox" checked={this.props.isSaveData} id="chk" onChange={this.props.onSaveData} /><span><b>Сохранить данные</b></span></p>            
			</div>
		);
	}
}

function Logon(props) {
	return (    
      <div className='back'>	   	
      	<div className='logon_container animate__animated animate__backInLeft'>
  	    	<AnimationHead />
  	    	<FormEntry form_id='frm0' class_name='frame' onLogon={props.onLogon} onSaveData={props.onSaveData} isSaveData={props.isSaveData} />          
      	</div>        
        <Lenta pos='up'/>
        <ClipsAnimation />
        <Lenta pos='down'/>      
      </div>
    );
}

class Start extends Component {
	constructor(props) {
      super(props);
      this.state = {showLogon:false,isSaveData:true,isMsg:false};

      this.user_exist=false;
      this.users = null;
      this.agentInfo = '';

      this.onLogon = this.onLogon.bind(this);
      this.onStateLogon = this.onStateLogon.bind(this);
      this.onSaveData = this.onSaveData.bind(this);
      this.checkCookie = this.checkCookie.bind(this);
      this.CheckUser = this.CheckUser.bind(this);    
      this.setCookie = this.setCookie.bind(this);
      this.getCookie = this.getCookie.bind(this);
      this.getConfig = this.getConfig.bind(this);
  }

  componentDidMount() {
    var account = this.checkCookie();
    
  	if (!account)
  		this.onStateLogon(true);
  	else     
      this.CheckUser(account);
  }

  CheckUser(account) {

    fetch('json/users.json')
      .then((result) => result.json())
      .then((result) => {

        this.users = result;
        var i = this.users.usr_name.findIndex ( (name)=> {return name==account.user_name;});

        if (i!=-1 && this.users.usr_pass[i]==account.password) {

          if (this.user_exist==false) {

            if (this.state.isSaveData) {

              this.setCookie("username", account.user_name, 365);
              this.setCookie("password", account.password, 365);
            }
          }
          
          this.onStateLogon(false);

          var conf_json = this.users.usr_conf[i];

          if (conf_json !=null && conf_json !='') {

            this.getConfig (conf_json,account.user_name,this.users.ws_server);
          }          

        }else {

          if (this.user_exist==true) {

            document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            this.user_exist = false;
            this.onStateLogon(true);

          }else {
            
            this.setState({isMsg:true});
          }      
        }      
      });    
  }
  
  getConfig(config,user,ws_server) {
    var complex,ws_server;
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = ()=> {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
          complex = JSON.parse(xhttp.responseText);  
 
          this.props.render('none');
          ReactDOM.render(
            <TrainExercise complex={complex} user_name={user} ws_server={ws_server} />,
            document.getElementById('wrap')
          );
      }
    };
    xhttp.open("GET", config, true);
    xhttp.send();
  }

  checkCookie() {
    var account = {user_name:'',password:''};

    account.password=this.getCookie("password");
    account.user_name=this.getCookie("username");

    this.user_exist=false;
    
    if (account.user_name != "") {
        if (account.password == "")
        {
            return false;
            //вывод формы на ввод
        }else
        {
            this.user_exist=true;  
            return account;       
        }
    } 
    return false;
  }

  setCookie(cname,cvalue,exdays) {
    var d = new Date();

    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  onStateLogon(state) {

  	this.setState({showLogon:state})
  }

  onLogon(account) {
  	this.CheckUser(account);
  
  }

  onSaveData(event) {
      this.setState(prevState => ({
        isSaveData: !prevState.isSaveData
      }));      
  }

  render() {
    
    if (!this.state.showLogon) {
      return null;
    }

  	return (
  		<div style={{width:'100%',height:'100%'}}>
  			<Logon onLogon={this.onLogon} onSaveData={this.onSaveData} isSaveData={this.state.isSaveData} />
        {
          this.state.isMsg?<MessageBox type='alert' effect='zoomInDown' render={()=>{this.setState({isMsg:false})}} effectOut='zoomOutDown'>Имя пользователя или пароль не верны</MessageBox>:null

        }  
  		</div>
  	);
  }
}

export {Start,MessageBox}

