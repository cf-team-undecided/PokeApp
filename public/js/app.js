'use strict';

$('#add-favorite').on('submit', addFavorite)

$('#delete-favorite').on('submit', deleteFavorite)

function addFavorite(event) {
  event.preventDefault();
  let add = $('#add').val();
  console.log('success');

  $.ajax({
    url: '/add',
    method: 'POST',
    data: {data: add},
    success: function() {
      $('#favorite-text').nextAll('.toggle').toggle();
    }
  })
}

function deleteFavorite(event) {
  event.preventDefault();
  let del = $('#delete').val();

  $.ajax({
    url: '/delete',
    method: 'DELETE',
    data: {data: del},
    success: function() {
      $('#favorite-text').nextAll('.toggle').toggle();
    }
  })
}
