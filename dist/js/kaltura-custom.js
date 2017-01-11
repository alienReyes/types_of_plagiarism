/**
 *  Kaltura embedding library.
 *  Tested with jQuery v1.4.4 - v1.9.1
 *
 */
$.noConflict();
var originalContainer = [];
var videoConfiguration;
var videoData = [];

var functionCount = 0;

var videoDataTemplate;
var LIBRARY_DOMAIN_BASE_PATH = "../";
var _kalturaPlayerLibraryInitialized = false;



function getGlobalConfigUrl(skin) {
    return "js/globalPlayerConfig.json";
}

function includeBootstrap () {
    //jQuery('head').append('<script src="' + LIBRARY_DOMAIN_BASE_PATH + 'player/js/bootstrap.min.js"></script>');
    jQuery('head').append('<script src="' + LIBRARY_DOMAIN_BASE_PATH + 'player/js/modernizr.custom.js"></script>');
    //jQuery('head').append('<link rel="stylesheet" type="text/css" href="' + LIBRARY_DOMAIN_BASE_PATH + 'player/css/bootstrap.min.css">');
}

function cleanupOldVersions () {
    jQuery(".controls .playerToggler").remove();
}


jQuery(document).ready(function () {
    if (!_kalturaPlayerLibraryInitialized) {
        //jQuery(document).find("body").append(generateDownloadingIframe());

        //get global config
        var skin = jQuery("script[data-skin-name]").attr("data-skin-name");
        jQuery.getJSON(getGlobalConfigUrl(skin))
            .then(function(data) {
                onGotGlobalconfiguration(data);
            })
            .fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ', ' + error;
                //console.log("Request Failed: " + err);
            });

        _kalturaPlayerLibraryInitialized = true;
    }
});

function onGotGlobalconfiguration(data) {
    jQuery('head').append('<link rel="stylesheet" type="text/css" href="' + data.css + '">');
    var kalturaMainLibrary = sprintf(data.kalturaBaseLibrary, data.partnerId, data.defaultPlayerId);

    console.info("loading: " + kalturaMainLibrary);
    jQuery.getScript(kalturaMainLibrary, function () {
        videoConfiguration = data;
        var qsParameters = getQueryStringParams();

        videoConfiguration.flashvars.userId = qsParameters.uid;
        videoConfiguration.flashvars.applicationName = qsParameters.app;
        videoConfiguration.flashvars.playbackContext = qsParameters.c;
        videoConfiguration.flashvars.externalInterfaceDisabled = "false";
        videoConfiguration.flashvars.cdnBasePath = videoConfiguration.cdnBasePath;

        videoDataTemplate = videoConfiguration.cdnBasePath + "{0}.json"

        renderVideos();
    });
}

function addVideoWrapper(data) {
    var playerContainerParent = jQuery("div[data-name=" + data.videoReferenceId + "]");
    var playerWrapper = jQuery("<div></div>");
    jQuery(playerWrapper).height(data.height + "px");
    jQuery(playerWrapper).addClass("videoWrapper");


    var playerContainer = jQuery(playerContainerParent).find(".player");
    playerContainer.wrap(playerWrapper);
}

function prepareContainer (data) {
    var playerContainerParent = jQuery("div[data-name='" + data.externalId + "']");
    var playerContainer = jQuery(playerContainerParent).find(".player");

    playerContainerParent.append("<div class='dummy'></div>");

    if (playerContainer.length === 0) {
        playerContainerParent.append("<div class='player'></div>")
    }


    var controlsContainer = jQuery(playerContainerParent).find(".controls");
    if (controlsContainer.length === 0) {
        playerContainerParent.append("<div class='controls'></div>");
    }

    playerContainerParent.after("<div class='kalturaClearPlayer'></div>")
}

function onGotVideo(data) {
    prepareContainer(data);
    videoData[data.videoReferenceId] = data;
    var playerContainerParent = jQuery("div[data-name='" + data.externalId + "']");
    /*if (data.hasOwnProperty("width")) {
        playerContainerParent.css("max-width", data.width);
    }*/


    //playerContainerParent.css("width", "100%");
    //playerContainerParent.css("height", "100%");

    mw.setConfig("KalturaSupport.LeadWithHTML5");
    var playerContainer = jQuery(playerContainerParent).find(".player");
    playerContainer.attr("id", data.videoReferenceId);
    playerContainer.attr("data-path", data.externalId);
    videoConfiguration.flashvars.path = data.externalId;

    jQuery("div[data-name='" + data.externalId + "']").attr("data-name", data.videoReferenceId);
    addVideoWrapper(data);


    originalContainer[data.videoReferenceId] = playerContainer.clone();

    embedVideo(videoConfiguration.partnerId, data.videoReferenceId, playerContainer.attr("id"),
        videoConfiguration.defaultPlayerId, videoConfiguration.flashvars, data.width, data.height, false);
    /*thumbEmbedVideo(videoConfiguration.partnerId, data.id, playerContainer.attr("id"),
     videoConfiguration.defaultPlayerId, videoConfiguration.flashvars, data.videoServerId);*/

    var downloadableSelect = generateDownloadableSelect(data);

    if (downloadableSelect) {
        playerContainerParent.find(".controls").append(downloadableSelect);
        jQuery(downloadableSelect).change(function (event) {
            var value = jQuery(event.currentTarget).val();
            if (value != "--") {
                var win = window.open(value, "downloadWindow");
                win.title = jQuery(event.currentTarget).find(":selected").text();
                //window.location.href = value;
            }
        });
    }
}


function renderVideos() {
    jQuery(".kal-group").each(function (i, item) {
        var playerContainer = jQuery(item).find(".player");
        var videoMetadataPath = jQuery(item).attr("data-name");

        var url = sprintf(videoDataTemplate, videoMetadataPath);
        console.log("rendering video...: " + url)
        jQuery.getScript(url);
    });
}

function onEmbedVideo (playerId) {
    //jQuery("#" + playerId).focus();
    var kdp = document.getElementById(playerId);
    kdp.sendNotification("cleanMedia");
    console.log("cleanMedia...");
}


function isChrome() {
    return Boolean(window.chrome);
}

function getVideoData(partnerId, videoId, playerContainerId, videoUiConfiguration, flashvars, entryId, width, height, focusVideo) {
    var localFlashvars;


    if (flashvars !== undefined) {
        localFlashvars = jQuery.extend(true, {}, flashvars);
    }


    var path = jQuery("#" + playerContainerId).attr("data-path");
    localFlashvars.path = path;
    localFlashvars.autoPlay = false;

    localFlashvars.referenceId = videoId;

    var videoData = {
        "targetId": playerContainerId,
        "wid": "_" + partnerId,
        "flashvars": localFlashvars,
        "uiconf_id": videoUiConfiguration,
        "readyCallback": onEmbedVideo,
        "params" : {
            "seamlessTabbing":"true",
            "autoPlay": false
        }
    };

    videoData.width = "100%";
    videoData.height = "100%";

    return videoData;
}

function thumbEmbedVideo(partnerId, videoId, playerContainerId, videoUiConfiguration, flashvars, entryId, width, height) {
    var videoData = getVideoData(partnerId, videoId, playerContainerId, videoUiConfiguration, flashvars, entryId);
    kWidget.thumbEmbed(videoData);
}

function embedVideo(partnerId, videoId, playerContainerId, videoUiConfiguration, flashvars, width, height, focusVideo) {
    var videoData = getVideoData(partnerId, videoId, playerContainerId, videoUiConfiguration, flashvars, null, width, height, focusVideo);
    kWidget.embed(videoData);
}

function generateDownloadableSelect(videoData) {
    console.log("generating dropdown...");
    var selectElement = jQuery("<select />")
    jQuery(selectElement).attr("class", "videoResources darkStyle");

    var videoOptionElement, audioOptionElement, transcriptOptionElement;

    jQuery(selectElement).append("<option value='--'>--Downloads--</option>")

    if (videoData.offlineVideo && videoData.offlineVideo != "") {
        videoOptionElement = generateOptionElement(videoData.offlineVideo, "Download Video w/CC");
        jQuery(selectElement).append(videoOptionElement);
    }
    if (videoData.audio && videoData.audio != "") {
        audioOptionElement  = generateOptionElement(videoData.audio, "Download Audio");
        jQuery(selectElement).append(audioOptionElement);
    }
    if (videoData.transcript && videoData.transcript != "") {
        transcriptOptionElement  = generateOptionElement(videoData.transcript, "Download Transcript");
        jQuery(selectElement).append(transcriptOptionElement);
    }

    return jQuery(selectElement).children().length > 1 ? selectElement : null;

}

function generateOptionElement(valueData, label) {
    var optionElement = jQuery("<option />");
    jQuery(optionElement).attr("value", valueData);
    jQuery(optionElement).html(label);

    return optionElement;
}

function generateDownloadingIframe() {
    var iframeElement = jQuery("<iframe></iframe>");
    jQuery(iframeElement).attr("id", "downloadHelper");
    return iframeElement;
}

function sprintf() {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
}

function getQueryStringParams() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getFunctionName() {
    return "_" + ((functionCount++).toString(16));
}




//IE8 fix for split with regex
var split;
// Avoid running twice; that would break the `nativeSplit` reference
split = split || function (undef) {

    var nativeSplit = String.prototype.split,
        compliantExecNpcg = /()??/.exec("")[1] === undef, // NPCG: nonparticipating capturing group
        self;

    self = function (str, separator, limit) {
        // If `separator` is not a regex, use `nativeSplit`
        if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
            return nativeSplit.call(str, separator, limit);
        }
        var output = [],
            flags = (separator.ignoreCase ? "i" : "") +
                (separator.multiline  ? "m" : "") +
                (separator.extended   ? "x" : "") + // Proposed for ES6
                (separator.sticky     ? "y" : ""), // Firefox 3+
            lastLastIndex = 0,
        // Make `global` and avoid `lastIndex` issues by working with a copy
            separator = new RegExp(separator.source, flags + "g"),
            separator2, match, lastIndex, lastLength;
        str += ""; // Type-convert
        if (!compliantExecNpcg) {
            // Doesn't need flags gy, but they don't hurt
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
        }
        /* Values for `limit`, per the spec:
         * If undefined: 4294967295 // Math.pow(2, 32) - 1
         * If 0, Infinity, or NaN: 0
         * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
         * If negative number: 4294967296 - Math.floor(Math.abs(limit))
         * If other: Type-convert, then use the above rules
         */
        limit = limit === undef ?
            -1 >>> 0 : // Math.pow(2, 32) - 1
            limit >>> 0; // ToUint32(limit)
        while (match = separator.exec(str)) {
            // `separator.lastIndex` is not reliable cross-browser
            lastIndex = match.index + match[0].length;
            if (lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));
                // Fix browsers whose `exec` methods don't consistently return `undefined` for
                // nonparticipating capturing groups
                if (!compliantExecNpcg && match.length > 1) {
                    match[0].replace(separator2, function () {
                        for (var i = 1; i < arguments.length - 2; i++) {
                            if (arguments[i] === undef) {
                                match[i] = undef;
                            }
                        }
                    });
                }
                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }
                lastLength = match[0].length;
                lastLastIndex = lastIndex;
                if (output.length >= limit) {
                    break;
                }
            }
            if (separator.lastIndex === match.index) {
                separator.lastIndex++; // Avoid an infinite loop
            }
        }
        if (lastLastIndex === str.length) {
            if (lastLength || !separator.test("")) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }
        return output.length > limit ? output.slice(0, limit) : output;
    };

// For convenience
    String.prototype.split = function (separator, limit) {
        return self(this, separator, limit);
    };

    return self;
}();
