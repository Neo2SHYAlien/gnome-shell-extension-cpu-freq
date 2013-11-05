const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
let indicator;
let _event=null;

const IndicatorName = "cpufreq";

const CpuFreq = new Lang.Class({
    Name: IndicatorName,
    Extends: PanelMenu.Button,

    _init: function(metadata, params){
        this.parent(null, IndicatorName);
        
        //title for the label
        this.title = "!";

        //cpupower installed
        this.util_present = false;
       
        this._label = new St.Label({
            text: "--",
            style_class: "cpufreq-label"
        });
        
        this.cpuPowerPath = GLib.find_program_in_path('cpupower');
        if(this.cpuPowerPath){
            this.util_present = true;
        }

        this._build_ui();
        
        if(this.util_present){
            //update every 5 seconds
            _event = GLib.timeout_add_seconds(0, 5, Lang.bind(this, function () {
                this._update_freq();
                this._update_popup();
                return true;
            }));
        }
    },

    _get_cpu_number: function(){
        let ret = GLib.spawn_command_line_sync("grep -c processor /proc/cpuinfo");
        return ret[1].toString().split("\n", 1)[0];
    },
    
    _get_governors: function(){
        let governors=new Array();
        let governorslist=new Array();
        let governoractual='';
        if(this.util_present){
             //get the list of available governors
            let cpupower_output1 = GLib.spawn_command_line_sync(this.cpuPowerPath+" frequency-info -g");
            if(cpupower_output1[0]) governorslist = cpupower_output1[1].toString().split("\n", 2)[1].split(" ");
            
            //get the actual governor
            let cpupower_output2 = GLib.spawn_command_line_sync(this.cpuPowerPath+" frequency-info -p");
            if(cpupower_output2[0]) governoractual = cpupower_output2[1].toString().split("\n", 2)[1].split(" ")[2].toString();
            
            for each (let governor in governorslist){
                let governortemp;
                if(governoractual==governor)
                    governortemp=[governor,true];
                else
                    governortemp=[governor,false];
                governors.push(governortemp);                
            }
        }
        
        return governors;
    },

    _update_freq: function() {
        let freqInfo=null;
        if(this.util_present){
            let cpupower_output = GLib.spawn_command_line_sync(this.cpuPowerPath+" frequency-info -fm");//get output of cpupower frequency-info -fm
            if(cpupower_output[0]) freqInfo = cpupower_output[1].toString().split("\n")[1];
            if (freqInfo){
                this.title=freqInfo;
            }
        }
        else{
            this.title="!"
        }
        
        this._label.set_text(this.title);
    },
    
    _update_popup: function() {
        this.menu.removeAll();
        if(this.util_present){  
            //get the available governors
            this.governors = this._get_governors();
            
            //build the popup menu
            if (this.governors.length>0){
                let governorItem;
                for (let i = 0; i < this.governors.length; i++) {
                    governorItem = new PopupMenu.PopupMenuItem((this.governors[i])[0]);
                    governorItem.setOrnament((this.governors[i])[1]);                    
                    governorItem.connect('activate', function(self) {
                            Util.spawn(["pkexec", "cpupower", "frequency-set", "-g", self.label.text ]);
                    });
                    this.menu.addMenuItem(governorItem);
                }
            }
        }
        else{
            let errorItem;
            errorItem = new PopupMenu.PopupMenuItem("Please install cpupower");
            this.menu.addMenuItem(errorItem);
        }    
    },
    
    _build_ui: function() {
        // destroy all previously created children, and add our label
        this.actor.get_children().forEach(function(c) {
            c.destroy()
        });
        
        this.actor.add_actor(this._label);
        this._update_freq();
        this._update_popup();
        
    }

});

function init() {
//do nothing
}

function enable() {
    indicator = new CpuFreq();
    Main.panel.addToStatusArea(IndicatorName, indicator);
}

function disable() {
    indicator.destroy();
    Mainloop.source_remove(_event);
    indicator = null;
}
