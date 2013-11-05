gnome-shell-extension-cpu-freq
==============================

View the actual frequency and change CPU frequency governor from gnome shell.

There is a bit of work to make it work though.

cpufreq
-------

You need CPU Frequency scaling set up to use it.  
**Archlinux**: https://wiki.archlinux.org/index.php/CPU_Frequency_Scaling

cpupower is the tool we are using, support for Ubuntu is coming in Sausy hopefully.

PLEASE PLEASE PLEASE READ THE ARCH LINUX WIKI PAGE CAREFULLY

Policy
------

I included the policy I use on Arch Linux (systemd init system) put it in /usr/share/polkit-1/actions/

Thanks
------
https://github.com/Farsx  
https://github.com/LeCoyote  
https://github.com/victornoel  
https://github.com/sonic414  
