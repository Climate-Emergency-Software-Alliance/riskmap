import {Reportcard} from 'Reportcard';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

//start-non-standard
@inject(Reportcard, EventAggregator)
//end-non-standard
export class Review {
  constructor(rc, ea) {
    this.reportcard = rc;
    this.ea = ea;
    this.report = {
      text: this.reportcard.description.value,
      water_depth: this.reportcard.depth,
      created_at: new Date().toISOString(),
      image_url: '',
      location: this.reportcard.location.markerLocation,
    };
    this.imageObject = this.reportcard.photo.file;

    //Check for mobile or desktop device
    if (/Mobi/.test(navigator.userAgent)) {
      this.isMobile = true;
    } else {
      this.isMobile = false;
    }

    //Check for available user inputs
    if (this.report.water_depth) {
      this.selDepth = this.report.water_depth + "cm";
    } else {
      this.selDepth = "Not selected";
    }
    if (this.report.text) {
      this.selDescription = this.report.text;
    } else {
      this.selDescription = "No description provided";
    }
  }

  get checkRequiredInputs() { //TODO: Add checks for file / data types
    if (this.report.location && this.report.water_depth && (this.imageObject || this.report.text)) {
      return true;
    } else {
      return false;
    }
  }

  attached() {
    if (this.imageObject) {
      this.drawImage(this.reportcard.photo.rotation);
    }

    var self = this;

    if (this.checkRequiredInputs) {
      var slideRange = $('#submitSlider').width() - $('#submitKnob').width(),
      slideThreshold = 0.9,
      slideTranslate = 0,
      slidePressed = false,
      swiped = false;

      //Slider touch start
      $('#submitKnob').on('touchstart mousedown', function (e) {
        var slideStartPos;
        if (self.isMobile) {
          slideStartPos = e.originalEvent.touches[0].pageX;
        } else {
          slideStartPos = e.clientX;
        }
        slidePressed = true;

        //Drag start
        $('#reviewWrapper').on('touchmove mousemove', function (e) {
          var slideDragPos;
          if (self.isMobile) {
            e.preventDefault();
            slideDragPos = e.originalEvent.touches[0].pageX;
          } else {
            slideDragPos = e.clientX;
          }
          slideTranslate = slideDragPos - slideStartPos;
          if (slidePressed && slideTranslate >= 0 && slideTranslate < slideRange) {
            $('#submitKnob').css({
              'left': slideTranslate + 'px'
            });
            $('#submitSlider').css({
              'background-color': 'rgba(31, 73, 99, ' + (slideTranslate / (slideThreshold * slideRange)) + ')'
            });

            //Swipe threshold crossed
            if (slideTranslate >= (slideThreshold * slideRange) && !swiped) {
              swiped = true;
              slidePressed = false;
              self.ea.publish('submit', self.report, self.imageObject);
            }
          }
        });

        //Drag end
        $(window).on('touchend mouseup', function () {
          if (slidePressed && slideTranslate < (slideThreshold * slideRange) && !swiped) {
            slidePressed = false;
            $('#submitKnob').animate({ //Swing back to start position
              'left': 0 + 'px'
            }, 50);
            $('#submitSlider').css({ //Reset slider background
              'background-color': 'transparent'
            });
          }
        });
      });
    } else {
      $('#submitKnob').css({
        'background-color': '#a0a0a0'
      });
      $('#termsConditions').html("Required flood location, water depth and atleast a photo or description to submit report");
    }
  }

  readTerms() {
    this.ea.publish('readTerms', 'click');
  }

  drawImage(deg) {
    let wrapper = this.preview;
    wrapper.width = $('#camera').width();
    wrapper.height = $('#camera').height();
    let reader = new FileReader();
    reader.onload = (e) => {
      let reviewImg = new Image();
      reviewImg.onload = () => {
        let imgW;
        let imgH;
        let trlX = -wrapper.width/2;
        let trlY = -wrapper.height/2;
        if (reviewImg.width >= reviewImg.height) {
          imgH = wrapper.height;
          imgW = Math.round((reviewImg.width * imgH) / reviewImg.height);
          trlX = trlX + Math.round((wrapper.width - imgW) / 2);
        } else {
          imgW = wrapper.width;
          imgH = Math.round((reviewImg.height * imgW) / reviewImg.width);
          trlY = trlY + Math.round((wrapper.height - imgH) / 2);
        }
        let cntxt = wrapper.getContext('2d');
        cntxt.translate(wrapper.width / 2, wrapper.height / 2);
        cntxt.rotate(deg * Math.PI / 180);
        cntxt.drawImage(reviewImg, trlX, trlY, imgW, imgH);
      };
      reviewImg.src = e.target.result;
    };
    reader.readAsDataURL(this.reportcard.photo.file[0]);
  }
}