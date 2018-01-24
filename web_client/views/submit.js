import View from 'girder/views/View';
import router from 'girder/router';
import events from 'girder/events';
import { getCurrentUser } from 'girder/auth';
import { restRequest } from 'girder/rest';

import MenuBarView from './menuBar.js';
import SubmitViewTemplate from '../templates/journal_submit.pug';
import SelectIssueTemplate from '../templates/journal_select_issue.pug';
import SubmitAuthorEntryTemplate from '../templates/journal_author_entry.pug';
import SubmitTagEntryTemplate from '../templates/journal_tag_entry.pug';

var SubmitView = View.extend({
    events: {
        'click .issueGen': function (event) {
            this.parentID = event.currentTarget.target;
            this.render(event.currentTarget.target, 2);
        },
        'submit #submitForm': function (event) {
            event.preventDefault();
            if (this.newSub || this.newRevision) {
                this._createSubmission({
                    'subName': this.$('#titleEntry').val().trim(),
                    'subDescription': this.$('#abstractEntry').val().trim()
                });
            }
        },
        'click #authorAdd': function (event) {
            console.log(event);
            event.preventDefault();
            this.$('#authors').append(SubmitAuthorEntryTemplate({info: {info: '1'}}));
        },
        'click #removeAuthor': function (event) {
            this.$(event.currentTarget.parentElement).remove();
        },
        'click #tagAdd': function (event) {
            event.preventDefault();
            this.$('#tags').append(SubmitTagEntryTemplate({info: {info: '1'}}));
        },
        'click #removeTag': function (event) {
            this.$(event.currentTarget.parentElement).remove();
        }
    },
    initialize: function (id) {
        this.user = getCurrentUser();
        if (id.id === 'new') {
            this.newSub = true;
            restRequest({
                type: 'GET',
                path: 'journal/setting',
                data: {
                    list: JSON.stringify([
                        'tech_journal.default_journal'
                    ])
                }
            }).done((resp) => {
                restRequest({
                    type: 'GET',
                    path: `journal/${resp['tech_journal.default_journal']}/openissues`
                }).done((jrnResp) => {
                    this.render(jrnResp, 1);
                });
            }); // End getting of OTJ Collection value setting
        } else {
            this.newRevision = id.NR;
            this.approval = id.approval;
            this.id = id.id;
            this.newSub = false;
            this.render(id.id, 2);
        }
    },
    render: function (subResp, state) {
        this.$el.html(SelectIssueTemplate({info: subResp}));
        var issueInfo;
        new MenuBarView({ // eslint-disable-line no-new
            el: this.$el,
            parentView: this
        });
        if (state === 1) {
            return this;
        } else {
            this.itemId = subResp;
            restRequest({
                type: 'GET',
                path: `folder/${this.itemId}`
            }).done((resp) => {
                if (this.newSub) {
                    issueInfo = {};
                } else {
                    issueInfo = resp;
                }
                if (this.newRevision) {
                    issueInfo.NR = this.newRevision;
                    this.parentID = issueInfo.parentID;
                }
                this.$('#pageContent').html(SubmitViewTemplate({ info: { info: {}, parInfo: {} } }));
                return this;
            }); // End getting of OTJ Collection value setting
        }
    },
    _createSubmission: function (inData) {
        var authors = [];
        var comments = [];
        var hasPermission = $('.subPermission:checked').val();
        var corpCLAVal = $('.CLAPermission:checked').val();
        if (hasPermission === 'No') {
            events.trigger('g:alert', {
                icon: 'ok',
                text: 'You must have permission to submit files in order to proceed',
                type: 'warning',
                timeout: 4000
            });
            return;
        }
        this.$('#authors .list-item').each(function (index, val) {
            var authorName = '';
            $(val).children('input').each(function (index2, val2) {
                if (val2.value !== '') authorName += ` ${val2.value}`;
            });
            if (authorName.length > 0) authors.push(authorName.trim());
        });
        var tags = [];
        this.$('#tags input').each(function (index, val) {
            tags.push(val.value.trim());
        });
        var subData = {
            'institution': this.$('#institutionEntry').val().trim(),
            'related': this.$('#relatedEntry').val().trim(),
            'type': this.$('#typeEntry').val().trim(),
            'copyright': this.$('#copyrightEntry').val().trim(),
            'grant': this.$('#grantEntry').val().trim(),
            'authors': authors,
            'tags': tags,
            'comments': comments,
            'permission': hasPermission,
            'CorpCLA': corpCLAVal,
            'targetIssue': this.itemId
        };
        if (this.newRevision) {
            subData.revisionNotes = this.$('#revisionEntry').val().trim();
            subData.previousRevision = this.itemId;
        }
        restRequest({
            type: 'POST',
            path: 'folder',
            data: {
                parentId: this.user.id,
                parentType: 'user',
                name: inData.subName,
                description: inData.subDescription
            },
            error: null
        }).done((resp) => {
            this._findUploadTarget(resp._id, subData);
        });
    },
    _findUploadTarget: function (parentId, subData) {
        var targetUrl = '#plugins/journal/submission/';
        // if new submission, generate first "revision" folder inside of generated folder
        restRequest({
            type: 'POST',
            path: 'folder',
            data: {
                parentId: parentId,
                parentType: 'folder',
                name: 'Revision 1'
            },
            error: null
        }).done((resp) => {
            restRequest({
                type: 'PUT',
                path: `journal/${resp._id}/metadata`,
                contentType: 'application/json',
                data: JSON.stringify(subData),
                error: null
            }).done((respMD) => {
                router.navigate(`${targetUrl}${resp._id}/upload/new`, {trigger: true});
            });
        });
    }
});

export default SubmitView;
