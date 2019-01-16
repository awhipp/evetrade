/*
 * Easing Compatibility v1 - http://gsgd.co.uk/sandbox/jquery/easing
 *
 * Adds compatibility for applications that use the pre 1.2 easing names
 *
 * Copyright (c) 2007 George Smith
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 */
!function(i){i.extend(i.easing,{easeIn:function(n,e,u,t,a){return i.easing.easeInQuad(n,e,u,t,a)},easeOut:function(n,e,u,t,a){return i.easing.easeOutQuad(n,e,u,t,a)},easeInOut:function(n,e,u,t,a){return i.easing.easeInOutQuad(n,e,u,t,a)},expoin:function(n,e,u,t,a){return i.easing.easeInExpo(n,e,u,t,a)},expoout:function(n,e,u,t,a){return i.easing.easeOutExpo(n,e,u,t,a)},expoinout:function(n,e,u,t,a){return i.easing.easeInOutExpo(n,e,u,t,a)},bouncein:function(n,e,u,t,a){return i.easing.easeInBounce(n,e,u,t,a)},bounceout:function(n,e,u,t,a){return i.easing.easeOutBounce(n,e,u,t,a)},bounceinout:function(n,e,u,t,a){return i.easing.easeInOutBounce(n,e,u,t,a)},elasin:function(n,e,u,t,a){return i.easing.easeInElastic(n,e,u,t,a)},elasout:function(n,e,u,t,a){return i.easing.easeOutElastic(n,e,u,t,a)},elasinout:function(n,e,u,t,a){return i.easing.easeInOutElastic(n,e,u,t,a)},backin:function(n,e,u,t,a){return i.easing.easeInBack(n,e,u,t,a)},backout:function(n,e,u,t,a){return i.easing.easeOutBack(n,e,u,t,a)},backinout:function(n,e,u,t,a){return i.easing.easeInOutBack(n,e,u,t,a)}})}(jQuery);