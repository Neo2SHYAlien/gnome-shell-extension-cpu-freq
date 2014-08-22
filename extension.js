const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
let indicator;
let _event = null;

const IndicatorName = "cpufreq";

const CpuFreq = new Lang.Class({
    Name: IndicatorName,
    Extends: PanelMenu.Button,

    _init: function(metadata, params) {
        this.parent(null, IndicatorName);

        //cpufrequtils installed
        this.util_present = false;

        this.label = new St.Label({
            text: "!",
            y_align: Clutter.ActorAlign.CENTER 
        });

        this.cpuFreqInfoPath = GLib.find_program_in_path('cpufreq-info');
        if (this.cpuFreqInfoPath) {
            this.util_present = true;
        }

        this._build_ui();

        if (this.util_present) {
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

    _get_governors: function() {
        let governors = new Array();
        let governorslist = new Array();
        let governoractual = '';
        if (this.util_present) {
            //get the list of available governors
            let cpufreq_output1 = GLib.spawn_command_line_sync(this.cpuFreqInfoPath + " -g");
            if (cpufreq_output1[0]) {
                governorslist = cpufreq_output1[1].toString().split("\n", 2)[0].split(" ");
            }

            //get the actual governor
            let cpufreq_output2 = GLib.spawn_command_line_sync(this.cpuFreqInfoPath + " -p");
            if (cpufreq_output2[0]) {
                governoractual = cpufreq_output2[1].toString().split("\n", 2)[0].split(" ")[2].toString();
            }

            for each (let governor in governorslist) {
                governors.push( [governor, (governoractual == governor)] );
            }
        }
        return governors;
    },

    _update_freq: function() {
        let freqInfo = null;
        if (this.util_present) {
            let cpufreq_output = GLib.spawn_command_line_sync(this.cpuFreqInfoPath + " -fm"); //get output of cpufreq-info -fm
            if (cpufreq_output[0]) {
                freqInfo = cpufreq_output[1].toString().split("\n")[0];
            }
            if (freqInfo) {
                this.label.set_text(freqInfo);
            }
            else {
                // Intel P-state introduced in linux-3.9 (default in linux-3.10 I think)
                // doesn't support directly frequencies. It allows only to switch between
                // the two available governors: performance and powersave. 
                // Show the governor name instead of the frequency
                let governors = this._get_governors();

                // find active governor
                let i = 0;
                while (!governors[i][1]){
                    i++;
                }
                this.label.set_text(governors[i][0]);
            }
        }
    },

    _update_popup: function() {
        this.menu.removeAll();
        if (this.util_present) {
            //get the available governors
            this.governors = this._get_governors();

            //build the popup menu
            if (this.governors.length > 0) {
                let governorItem;
                for each (let governor in this.governors) {
                    governorItem = new PopupMenu.PopupMenuItem(governor[0]);
                    governorItem.setOrnament(governor[1]);
                    governorItem.connect('activate', function(self) {
                            Util.spawn(["pkexec", "cpufreq-set", "-g", self.label.text ]);
                    });
                    this.menu.addMenuItem(governorItem);
                }
            }
        } else {
            let errorItem = new PopupMenu.PopupMenuItem("Please install cpufrequtils");
            this.menu.addMenuItem(errorItem);
        }
    },

    _build_ui: function() {
        // destroy all previously created children, and add our label
        this.actor.get_children().forEach(function(c) {
            c.destroy()
        });

        this.actor.add_actor(this.label);
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
