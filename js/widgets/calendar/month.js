define(['base'], function(Base){

    var dayTemplate = Base.app.compileTemplate('<td><a href="#selectDate" data-date="{{date}}" data-month="{{month}}" data-year="{{year}}" class="day action {{#if isToday}}today{{/if}} {{#if isSelected}}selected{{/if}}{{#if isDisabled}}disabled{{/if}}">{{date}}</a> </td>')
    var View = Base.View.extend({
        className:'month',
        template:'<a href="#prevMonth" class="action but-prev"> < </a><div class="month-name">{{monthName month}}-{{year}}</div> <a href="#nextMonth" class="action but-next"> > </a> ',
        postRender:function(){
            var table = $('<table></table>');
            var attributes = this.model.toJSON();
            var startOfCal = this.getDate().startOf('week');
            var count = 0;
            var tableRow, isToday = false, isSelected=false, isDisabled=false;
            var todayEpoch = moment().startOf('day').valueOf();
            var selectedEpoch = attributes.selectedEpoch;

            while(count < 42){
                var day = startOfCal.day();
                if(day === 0){
                    tableRow = $('<tr></tr>');
                    table.append(tableRow);
                }

                if(startOfCal.valueOf() === todayEpoch){
                    isToday= true;
                }else{
                    isToday = false;
                }

                if(startOfCal.valueOf() === selectedEpoch){
                    isSelected= true;
                }else{
                    isSelected = false;
                }


                if(startOfCal.month() !== attributes.month){
                    isDisabled = true;
                }else{
                    isDisabled = false;
                }
                tableRow.append(dayTemplate({date:startOfCal.date(), month:startOfCal.month(), year:startOfCal.year(), isToday:isToday, isSelected:isSelected, isDisabled:isDisabled}));
                startOfCal.add('days', 1);
                count++;
            }
            this.$el.append(table);
        },
        getDate:function(){
            var attributes = this.model.toJSON();
            return moment({y:attributes.year, M:attributes.month, d:1});
        },
        changeHandler:function(){
            this.render();
        },
        actionHandler:function(action, e){
            switch(action){
                case 'prevMonth':
                    var date = this.getDate();
                    date.add('months', -1);
                    this.model.set({
                        month:date.month(),
                        year:date.year()
                    })
                    break;

                case 'nextMonth':
                    var date = this.getDate();
                    date.add('months', 1);
                    this.model.set({
                        month:date.month(),
                        year:date.year()
                    })
                    break;
                case 'selectDate':
                    var target = $(e.target);
                    var data = target.data();
                    var date = moment({y:data.year, M:data.month, d:data.date});
                    this.model.set('selectedEpoch', date.valueOf());
                    this.trigger('dateClicked', date);
                    break;
                default:
                    alert('unhandled action: '+ action);
                    break;
            }
        }
    })

    var Model = Base.Model.extend({
         defaults:{
             month:moment().month(),
             year:moment().year(),
             selectedEpoch:moment().startOf('day').valueOf()
         }
    });

    return {
        View:View,
        Model:Model
    }
})