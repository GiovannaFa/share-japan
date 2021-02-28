const Posts = require('./posts');

module.exports = async viewModel =>  {

    const results = await Posts.popular();
    viewModel.popular = results;
    return viewModel;
}