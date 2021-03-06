import View from '@girder/core/views/View';
import { restRequest } from '@girder/core/rest';

import MenuBarView from '../../views/menuBar.js';
import adminCategoriesTemplate from './adminCategories.pug';
import adminCategoriesEntryTemplate from './adminCategories_entry.pug';

const adminCategoriesPage = View.extend({
    events: {
        'click .DeleteRootLink': function (event) {
            var catName = $(event.currentTarget).siblings('h4').text();
            restRequest({
                method: 'DELETE',
                url: `journal/category?text=${catName}&tag=disclaimer`
            }).done((resp) => {
                $(event.currentTarget).closest('.TreeEntry').remove();
            });
        },
        'click .AddRootLink': function (event) {
            this.$(event.currentTarget.parentNode).find('.AddRootCategory').show();
        },
        /* 'click .categoryObj': function (event) {
            this.categoryObj = event.currentTarget;
            $('.AddCategory').show();
        }, */
        'submit #addTree': function (event) {
            event.preventDefault();
            var newCatName = this.$('#newTreeName').val();
            //  Call out to category API to save initial object
            restRequest({
                method: 'POST',
                url: `journal/category?text=${newCatName}&tag=categories`
            }).done((resp) => {
                this.$('#treeWrapper').html(this.$('#treeWrapper').html() + adminCategoriesEntryTemplate({'name': newCatName, 'values': []}));
            });
        },
        'submit #addRootCategoryForm': function (event) {
            event.preventDefault();
            var parent = $(event.currentTarget).closest('.TreeEntry');
            parent.find('.categoryTree').find('.categoryList').append('<div class="categoryEntry"><li class="categoryObj">' +
                                                                          $(event.currentTarget).children().first().val() +
                                                                          '</li>&nbsp<a class="removeCategory">Remove</a></div>');
            this.updateCategory(parent);
        },
        'click .removeCategory': function (event) {
            var parent = $(event.currentTarget).closest('.TreeEntry');
            $(event.currentTarget).closest('.categoryEntry').remove();
            this.updateCategory(parent);
        },
        'submit #addNewChildCategory': function (event) {
            event.preventDefault();
            // Change old li object to ul to allow for subcategories?
            // $(this.categoryObj).closest(".categoryTree ul").append('<ul><li class="categoryObj">'+$(event.currentTarget).children().first().val()+'</li></ul>')
        }
    },
    initialize: function (query) {
        restRequest({
            method: 'GET',
            url: 'journal/categories?tag=categories'
        }).done((resp) => {
            this.render(resp);
        }); // End getting of OTJ Collection value setting
    },
    render: function (subData) {
        this.$el.html(adminCategoriesTemplate());
        for (var key in subData) {
            this.$('#treeWrapper').html(this.$('#treeWrapper').html() + adminCategoriesEntryTemplate({'name': subData[key]['key'], 'values': subData[key]['value']}));
        }
        new MenuBarView({ // eslint-disable-line no-new
            el: this.$('#headerBar'),
            parentView: this
        });
        return this;
    },
    updateCategory: function (treeEntry) {
        var catName = treeEntry.find('h4').text();
        var valueData = {'key': catName, 'value': []};
        treeEntry.find('.categoryTree').find('.categoryList').find('li').each(function (index, val) {
            valueData['value'].push($(val).text());
        });
        restRequest({
            method: 'PUT',
            url: 'journal/category?tag=categories',
            data: {
                list: JSON.stringify([valueData])
            }
        });
    }
});

export default adminCategoriesPage;
