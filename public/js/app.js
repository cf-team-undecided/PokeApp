'use strict';

$('#add-favorite').on('submit', addFavorite)

$('#delete-favorite').on('submit', deleteFavorite)

function addFavorite(event) {
  event.preventDefault();
  let add = $('#add').val();

  $.ajax({
    url: '/add',
    method: 'POST',
    data: {data: add}
  })
    .then();
}

function deleteFavorite(event) {
  event.preventDefault();
  let del = $('#delete').val();

  $.ajax({
    url: '/delete',
    method: 'DELETE',
    data: {data: del}
  })
    .then();
}
