//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
/// GradientCheck 
/// Written by John Degenstein, Purdue University
/// Version 0.96
/// Date: February X, 2016
/// Mears Axial Dispersion formula corrected
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//
//Copyright © 2016 Purdue University All rights reserved. 
//
//Developed by: Purdue Catalysis Center, School of Chemical Engineering, Purdue University 
//https://engineering.purdue.edu/~catalyst/ 
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal with the Software without restriction, including without limitation the rights to use, copy, modify, //merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: 
//Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimers.
//Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimers in the documentation and/or other materials provided with the distribution.
//Neither the names of ??, nor the names of its contributors may be used to endorse or promote products derived from this Software without specific prior written permission.
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE CONTRIBUTORS OR COPYRIGHT HOLDERS //BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS WITH THE SOFTWARE.
//



//////////////////////////////////////////////////////////////////////
//this code is for hiding sections of calculated properties with the red "+" signs
$(document).ready(function(){
  $('#hide_mixing').on('click', function(){
    $('#mixing').toggle('fast');
  });

  $('#hide_ndims').on('click', function(){
    $('#ndims').toggle('fast');
  });

  $('#hide_catprops').on('click', function(){
    $('#catprops').toggle('fast');
  });

  $('#hide_intgrad').on('click', function(){
    $('#intgrad').toggle('fast');
  });

  $('#hide_calculated').on('click', function(){
    $('#calculated').toggle('fast');
  });

  $('#hide_bedscalegrads').on('click', function(){
    $('#bedscalegrads').toggle('fast');
  });

  $('#hide_valtests').on('click', function(){
    $('#valtests').toggle('fast');
  });

  $('#hide_mears_disp').on('click', function(){
    $('#tbody_mears_disp').toggle('fast');
  });

  $('#hide_gierman_disp').on('click', function(){
    $('#tbody_gierman_disp').toggle('fast');
  });

  $('#hide_sie_walleffect').on('click', function(){
    $('#tbody_sie_walleffect').toggle('fast');
  });

  $('#hide_mears_radialintp').on('click', function(){
    $('#tbody_mears_radialintp').toggle('fast');
  });
});


//////////////////////////////////////////////////////////////////////
//used for math.format calls later to reformat number output
var val_out = {notation: 'auto', precision: 3}; // see http://mathjs.org/docs/reference/functions/format.html for further info

//////////////////////////////////////////////////////////////////////
//the below function triggers change for all input IDs in the document, in order to manually update the calculations
$(document).ready(function(){
  $("#calculate_all_fields").on('click', function (){
    var ids = $('input[id]').map(function() {
      return this.id;
    }).get();

    ids = ids.map(function(currentItem){
      return "#" + currentItem //make list of IDs prepended with a "#"
    });

    var idsJoined = ids.join(","); //make into a single long string
    
    $(idsJoined).trigger("change"); //triggers change to update later calculations
  });
});


//preinitialize myFile object, later used for logic check
var myFile = $('#form_data_json').prop('files');

////////////////////////////////////////////////////////////////////////////
// reads in an input JSON from user file
$(document).ready(function(){
  $("#form_data_json").on('change', function(){
    var myFile = $('#form_data_json').prop('files');
    var reader = new FileReader();

    reader.onload = function(event) { //wait for asynchronous load event to take place
      var myData = event.target.result;
      window.myData = myData;
    };

    if (myFile.length == 0) {
      var JSONdata = {}
    } else {
      var JSONdata = reader.readAsText(myFile.item(0));
    }
  });
});

////////////////////////////////////////////////////////////////////////////
//populates above input JSON file into the form itself
$(document).ready(function(){
  $("#populate_inputs").on('click', function(){
    $(".initialize").trigger("change");
    ////////////////////////
    var parsedJSON = $.parseJSON(window.myData);
    // next line looks for all input sections in html
    var $inputs = $('input'); //get inputs in HTML
    var $textarea = $('textarea'); //get textareas in HTML
    var $dropdowns = $('select'); //get dropdowns (aka select) in HTML
    $.each(parsedJSON, function(i, pair) {
      if (pair.name == "notes_section") { //hardcoded to id of the only textarea
        $textarea.filter(function() { //populates text area (currently only one) with text
          return pair.name == this.id;
        }).val(pair.value);
      } else if (/^dr_/i.test(pair.name)) { //looks for id that starts with dr_ to indicate dropdown
        $dropdowns.filter(function() { //populates dropdown (aka select) with text
          return pair.name == this.id;
        }).val(pair.value);
        $("#dr_cat_shape,#dr_num_reactants,#dr_num_products").trigger("change");//necessary to force HTML to trigger additional particle dimensions, and reactant/products 
      } else if (/^ck_/i.test(pair.name)) { //looks for id that starts with ck_ to indicate checkbox
        $inputs.filter(function() {
          if (this.value == "on") { //if the value is on then send pair.name to parent
            return pair.name == this.id  
          } else { //if the value is NULL then dont do anything, and the checkbox will KEEP its current state <-- not fixing this issue for now
            //do nothing
          }
        }).prop('checked',true);
      } else { //for everything else not included above
        $inputs.filter(function() { //populates input areas that match "id" with the JSON input
          return pair.name == this.id;
        }).val(pair.value);
      }
    });
  });
});

////////////////////////////////////////////////////////////////////////////
//function for hiding/showing additional particle dimensions for Spheres/Cylinders/Rings
$(document).ready(function(){
  $('#dr_cat_shape,#populate_inputs').on('change click', function(){
    if ($('#dr_cat_shape').val() == "Spheres"){$('#tbody_cat_shape_L').hide('fast');$('#tbody_cat_shape_Rin').hide('fast');} //hide both additional particle dimensions
    if ($('#dr_cat_shape').val() == "Cylinders"){$('#tbody_cat_shape_L').show('fast');$('#tbody_cat_shape_Rin').hide('fast');} //show L particle dimensions
    if ($('#dr_cat_shape').val() == "Rings"){$('#tbody_cat_shape_L').show('fast');$('#tbody_cat_shape_Rin').show('fast');} //show both additional particle dimensions
  });
});

////////////////////////////////////////////////////////////////////////////
//function for hiding/showing additional reactants and products and their property inputs and limiting reactant
$(document).ready(function(){
  $('#dr_num_reactants,#dr_num_products,#populate_inputs').on('keyup keydown change click', function(){
    if ($('#dr_num_reactants').val() == "One" && $('#dr_num_products').val() == "One"){ //OPTION A -- hide 2 and 4, header reads A, B, C
      $('#tr_reactants_products_diluent_header').html('<td></td><td class="MainReact">Main<br>Reactant A</td><td>Product B</td><td>Diluent C</td><td></td>') //header reads A, B, C
      $('#tr_reactants_products_diluent_header_igdens').html('<td></td><td>Reactant A</td><td>Product B</td><td>Diluent C</td><td></td>') //header reads A, B, C
      $('#tr_reactants_products_diluent_header_fuller').html('<td></td><td>Reactant A</td><td>Product B</td><td>Diluent C</td><td></td>') //header reads A, B, C
      $('#tr_reactants_products_diluent_header_lebas').html('<td></td><td>Reactant A</td><td>Product B</td><td>Diluent C</td><td></td>') //header reads A, B, C
      $('input.nar').css('max-width','110px'); //change width of input cells
      //hide BOTH 2 and 4
      $('#hide_molweight2,#hide_molweight4,#hide_fluidvisc2,#hide_fluidvisc4,#hide_heatcapacity2,#hide_heatcapacity4,#hide_thermalcond2,#hide_thermalcond4,#hide_molfrac2,#hide_molfrac4,#hide_res_gasdens2,#hide_res_gasdens4,#hide_difvol2,#hide_difvol4,#hide_column_dvol2,#hide_column_dvol4,#hide_column_vb2,#hide_column_vb4,#hide_molar_boil_vol2,#hide_molar_boil_vol4,#hide_liq_density2,#hide_liq_density4,#hide_wilke_assoc_phi2,#hide_wilke_assoc_phi4,#tbody_limitingreactant').hide('fast');
    } else if ($('#dr_num_reactants').val() == "Two" && $('#dr_num_products').val() == "One"){ //OPTION B -- hide 4, header reads A, B, C, D
      $('#tr_reactants_products_diluent_header').html('<td></td><td class="MainReact">Main<br>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('#tr_reactants_products_diluent_header_igdens').html('<td></td><td>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('#tr_reactants_products_diluent_header_fuller').html('<td></td><td>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('#tr_reactants_products_diluent_header_lebas').html('<td></td><td>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('input.nar').css('max-width','100px'); //change width of input cells
      $('#hide_molweight2,#hide_fluidvisc2,#hide_heatcapacity2,#hide_thermalcond2,#hide_molfrac2,#hide_res_gasdens2,#hide_difvol2,#hide_column_dvol2,#hide_column_vb2,#hide_molar_boil_vol2,#hide_liq_density2,#hide_wilke_assoc_phi2,#tbody_limitingreactant').show('fast'); //show 2
      $('#hide_molweight4,#hide_fluidvisc4,#hide_heatcapacity4,#hide_thermalcond4,#hide_molfrac4,#hide_res_gasdens4,#hide_difvol4,#hide_column_dvol4,#hide_column_vb4,#hide_molar_boil_vol4,#hide_liq_density4,#hide_wilke_assoc_phi4').hide('fast'); //hide 4
    } else if ($('#dr_num_reactants').val() == "One" && $('#dr_num_products').val() == "Two"){ //OPTION C -- hide 2, header reads A, B, C, D
      $('#tr_reactants_products_diluent_header').html('<td></td><td class="MainReact">Main<br>Reactant A</td><td>Product B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('#tr_reactants_products_diluent_header_igdens').html('<td></td><td>Reactant A</td><td>Product B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('#tr_reactants_products_diluent_header_fuller').html('<td></td><td>Reactant A</td><td>Product B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('#tr_reactants_products_diluent_header_lebas').html('<td></td><td>Reactant A</td><td>Product B</td><td>Product C</td><td>Diluent D</td><td></td>') //header reads A, B, C, D
      $('input.nar').css('max-width','100px'); //change width of input cells
      $('#hide_molweight2,#hide_fluidvisc2,#hide_heatcapacity2,#hide_thermalcond2,#hide_molfrac2,#hide_res_gasdens2,#hide_difvol2,#hide_column_dvol2,#hide_column_vb2,#hide_molar_boil_vol2,#hide_liq_density2,#hide_wilke_assoc_phi2,#tbody_limitingreactant').hide('fast'); //hide 2
      $('#hide_molweight4,#hide_fluidvisc4,#hide_heatcapacity4,#hide_thermalcond4,#hide_molfrac4,#hide_res_gasdens4,#hide_difvol4,#hide_column_dvol4,#hide_column_vb4,#hide_molar_boil_vol4,#hide_liq_density4,#hide_wilke_assoc_phi4').show('fast'); //show 4
    } else if ($('#dr_num_reactants').val() == "Two" && $('#dr_num_products').val() == "Two"){ //OPTION D -- hide NONE, header reads A, B, C, D, E
      $('#tr_reactants_products_diluent_header').html('<td></td><td class="MainReact">Main<br>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Product D</td><td>Diluent E</td><td></td>') //header reads A, B, C, D, E
      $('#tr_reactants_products_diluent_header_igdens').html('<td></td><td>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Product D</td><td>Diluent E</td><td></td>') //header reads A, B, C, D, E
      $('#tr_reactants_products_diluent_header_fuller').html('<td></td><td>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Product D</td><td>Diluent E</td><td></td>') //header reads A, B, C, D, E
      $('#tr_reactants_products_diluent_header_lebas').html('<td></td><td>Reactant A</td><td>Reactant B</td><td>Product C</td><td>Product D</td><td>Diluent E</td><td></td>') //header reads A, B, C, D, E
      $('input.nar').css('max-width','90px'); //change width of input cells
      //show BOTH 2 and 4
      $('#hide_molweight2,#hide_molweight4,#hide_fluidvisc2,#hide_fluidvisc4,#hide_heatcapacity2,#hide_heatcapacity4,#hide_thermalcond2,#hide_thermalcond4,#hide_molfrac2,#hide_molfrac4,#hide_res_gasdens2,#hide_res_gasdens4,#hide_difvol2,#hide_difvol4,#hide_column_dvol2,#hide_column_dvol4,#hide_column_vb2,#hide_column_vb4,#hide_molar_boil_vol2,#hide_molar_boil_vol4,#hide_liq_density2,#hide_liq_density4,#hide_wilke_assoc_phi2,#hide_wilke_assoc_phi4,#tbody_limitingreactant').show('fast');
    }

  });
});

////////////////////////////////////////////////////////////////////////////
//function for hiding/showing liquid vs. gas relevant cells
$(document).ready(function(){
  $('#dr_reaction_phase,#populate_inputs').on('change click', function(){
    if ($('#dr_reaction_phase').val() == "Gas Phase"){
      $('#tbody_gas_dvol').show('fast');
      $('#tbody_liquid_vb').hide('fast');
      $('#tbody_ideal_gas_dens').show('fast');
      $('#tbody_gas_prandtl_test').show('fast');
    } else if ($('#dr_reaction_phase').val() == "Liquid Phase"){
      $('#tbody_gas_dvol').hide('fast');
      $('#tbody_liquid_vb').show('fast');
      $('#tbody_ideal_gas_dens').hide('fast');
      $('#tbody_gas_prandtl_test').hide('fast');
    }
  });
});

////////////////////////////////////////////////////////////////////////////
//function for hiding/showing the advanced options section & setting checkbox=unchecked by default
$(document).ready(function(){
  $('#ck_override_diffusivity').prop('checked', false); //set checkbox to unchecked by default when the document loads
  
  $('#hide_advanced_input').on('click', function(){
    if ($('#ck_override_diffusivity').is(':checked') == true){ //if override is checked do NOT allow the section to be hidden!!

      if ($('#tbody_advanced_input').is(':visible') == true) {
        //do nothing
      } else {
        $('#tbody_advanced_input').show();
      }
    } else if ($('#ck_override_diffusivity').is(':checked') == false){ //if override is UNchecked then it is OK to allow the section to be hidden
      if ($('#tbody_advanced_input').is(':hidden') == false) {
        $('#tbody_advanced_input').toggle('fast');
      } else {
        $('#tbody_advanced_input').toggle('fast');
      }
    }
  });
});


////////////////////////////////////////////////////////////////////////////
//manually set name to be the same as id for inputs/textarea/select
$(document).ready(function(){
    var $inputs = $('form.insec').find('input'); //get inputs in form
    var $inputs2 = $('form.insec2').find('input'); //get inputs in second part of form
    var $textarea = $('form.insec').find('textarea'); //get textareas in form
    var $dropdowns = $('form.insec').find('select'); //get dropdown/select in form

    ///////////////////////////////////////
    //NOTE: VERY IMPORTANT!, if one wants to save inputs to the JSON file
    //the name attribute MUST be set for anything to be captured by the 
    //later command 'serializeArray', the following code in this block is
    //a hack to set the name to the id tag
    ///////////////////////////////////////

    $inputs.each(function (){ //set the name to id for inputs
      this.name = this.id;
    });
    $inputs2.each(function (){
      this.name = this.id;
    });
    $textarea.each(function (){
      this.name = this.id;
    });
    $dropdowns.each(function (){
      this.name = this.id;
    });
});

////////////////////////////////////////////////////////////////////////////
//function for saving current input values to a JSON file for later use
$(document).ready(function(){
  $("#save_inputs_section_as_JSON").on('click', function (){
    var str = $('form.insec').serializeArray(); //find inputs within class=insec form 
    var str2 = $('form.insec2').serializeArrayWithCheckboxes(); //find inputs within class=insec2 form INCLUDING CHECKBOXES w/ custom function
    var strCombined = str.concat(str2); //append insec2 to insec serialized form
    var strjson = JSON.stringify(strCombined, null, '\t'); //convert to string JSON format for saving

    var filename = $("#JSON_filename").val(); //get user input for filename, defaulted to 'catalysis'
    var suffix = ".json"; //add json suffix
    var output = document.querySelector('a#save_inputs_section_as_JSON'); //NOT compatible with IE11 

    output.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(strjson);
    output.download = filename + suffix;
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// Begin section for actually inputting and calculating things  ////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////


//define scope object that will be used to store unrounded values 
var catscope = {};

$(document).ready(function(){
  $(document).ready(function(){
    $(".initialize").trigger("change");
  });

  //////////////////////////////////////////////////////////////////////////////////
  // Function to add all of the inputs section into the "catscope" object for later use
  $("#temp,.initialize,#button_fuller_dvol_calculate").on('keyup keydown change click', function (){
    //inputs
    var dr_reaction_phase = $("#dr_reaction_phase").val();
    var temp = $("#temp").val().toNum(); //kelvin 
    var pressure = $("#pressure").val().toNum();//bar
    var R_rctr = $("#R_rctr").val().toNum();
    var L_bed = $("#L_bed").val().toNum();
    var R_p = $("#R_p").val().toNum();
    var R_p_inner = $("#R_p_inner").val().toNum();
    var L_p = $("#L_p").val().toNum();
    var rxn_rate = $("#rxn_rate").val().toNum();
    var rxn_enthalpy = $("#rxn_enthalpy").val().toNum();
    var dr_rxn_order = $("#dr_rxn_order").val().toNum(); //toNum for reaction order
    var rxn_activation_energy = $("#rxn_activation_energy").val().toNum();
    var rxn_conversion1 = $("#rxn_conversion1").val().toNum();
    var cat_rho_bulk = $("#cat_rho_bulk").val().toNum();
    var cat_void_frac = $("#cat_void_frac").val().toNum();
    var cat_thermal_cond = $("#cat_thermal_cond").val().toNum();
    var cat_surf_area = $("#cat_surf_area").val().toNum();
    var cat_pore_volume = $("#cat_pore_volume").val().toNum();
    var cat_pore_tortuosity = $("#cat_pore_tortuosity").val().toNum();
    var dr_cat_shape = $("#dr_cat_shape").val();
    var molfrac1 = $("#molfrac1").val().toNum();
    var molfrac2 = $("#molfrac2").val().toNum();
    var molfrac3 = $("#molfrac3").val().toNum();
    var molfrac4 = $("#molfrac4").val().toNum();
    var molfrac5 = $("#molfrac5").val().toNum();
    var fluidvisc1 = $("#fluidvisc1").val().toNum();
    var fluidvisc2 = $("#fluidvisc2").val().toNum();
    var fluidvisc3 = $("#fluidvisc3").val().toNum();
    var fluidvisc4 = $("#fluidvisc4").val().toNum();
    var fluidvisc5 = $("#fluidvisc5").val().toNum();
    var heatcapacity1 = $("#heatcapacity1").val().toNum();
    var heatcapacity2 = $("#heatcapacity2").val().toNum();
    var heatcapacity3 = $("#heatcapacity3").val().toNum();
    var heatcapacity4 = $("#heatcapacity4").val().toNum();
    var heatcapacity5 = $("#heatcapacity5").val().toNum();
    var thermalcond1 = $("#thermalcond1").val().toNum();
    var thermalcond2 = $("#thermalcond2").val().toNum();
    var thermalcond3 = $("#thermalcond3").val().toNum();
    var thermalcond4 = $("#thermalcond4").val().toNum();
    var thermalcond5 = $("#thermalcond5").val().toNum();
    var molweight1 = $("#molweight1").val().toNum();
    var molweight2 = $("#molweight2").val().toNum();
    var molweight3 = $("#molweight3").val().toNum();
    var molweight4 = $("#molweight4").val().toNum();
    var molweight5 = $("#molweight5").val().toNum();

    //GAS specific
    var difvol1 = $("#difvol1").val().toNum();
    var difvol2 = $("#difvol2").val().toNum();
    var difvol3 = $("#difvol3").val().toNum();
    var difvol4 = $("#difvol4").val().toNum();
    var difvol5 = $("#difvol5").val().toNum();

    //LIQUID specific
    var liq_density1 = $("#liq_density1").val().toNum();
    var liq_density2 = $("#liq_density2").val().toNum();
    var liq_density3 = $("#liq_density3").val().toNum();
    var liq_density4 = $("#liq_density4").val().toNum();
    var liq_density5 = $("#liq_density5").val().toNum();
    var molar_boil_vol1 = $("#molar_boil_vol1").val().toNum();
    var molar_boil_vol2 = $("#molar_boil_vol2").val().toNum();
    var molar_boil_vol3 = $("#molar_boil_vol3").val().toNum();
    var molar_boil_vol4 = $("#molar_boil_vol4").val().toNum();
    var molar_boil_vol5 = $("#molar_boil_vol5").val().toNum();
    var wilke_assoc_phi2 = $("#wilke_assoc_phi2").val().toNum();
    var wilke_assoc_phi3 = $("#wilke_assoc_phi3").val().toNum();
    var wilke_assoc_phi4 = $("#wilke_assoc_phi4").val().toNum();
    var wilke_assoc_phi5 = $("#wilke_assoc_phi5").val().toNum();

    //effective diffusivity checkbox & override value
    var ck_override_diffusivity = $("#ck_override_diffusivity").is(':checked');
    var diff_effective_override = $("#diff_effective_override").val().toNum();

    //look for lack of entries and replace with zero if empty
    if ($('#molfrac1').val().length == 0){molfrac1 = 0;} //if there is no molfrac entry assume it is zero
    if ($('#molfrac2').val().length == 0){molfrac2 = 0;}
    if ($('#molfrac3').val().length == 0){molfrac3 = 0;}
    if ($('#molfrac4').val().length == 0){molfrac4 = 0;}
    if ($('#molfrac5').val().length == 0){molfrac5 = 0;}
    if ($('#fluidvisc1').val().length == 0){fluidvisc1 = 0;}
    if ($('#fluidvisc2').val().length == 0){fluidvisc2 = 0;}
    if ($('#fluidvisc3').val().length == 0){fluidvisc3 = 0;}
    if ($('#fluidvisc4').val().length == 0){fluidvisc4 = 0;}
    if ($('#fluidvisc5').val().length == 0){fluidvisc5 = 0;}
    if ($('#heatcapacity1').val().length == 0){heatcapacity1 = 0;}
    if ($('#heatcapacity2').val().length == 0){heatcapacity2 = 0;}
    if ($('#heatcapacity3').val().length == 0){heatcapacity3 = 0;}
    if ($('#heatcapacity4').val().length == 0){heatcapacity4 = 0;}
    if ($('#heatcapacity5').val().length == 0){heatcapacity5 = 0;}
    if ($('#thermalcond1').val().length == 0){thermalcond1 = 0;}
    if ($('#thermalcond2').val().length == 0){thermalcond2 = 0;}    
    if ($('#thermalcond3').val().length == 0){thermalcond3 = 0;}
    if ($('#thermalcond4').val().length == 0){thermalcond4 = 0;}
    if ($('#thermalcond5').val().length == 0){thermalcond5 = 0;}
    if ($('#molweight1').val().length == 0){molweight1 = 0;} //if there is no molweight entry assume it is zero
    if ($('#molweight2').val().length == 0){molweight2 = 0;}
    if ($('#molweight3').val().length == 0){molweight3 = 0;}
    if ($('#molweight4').val().length == 0){molweight4 = 0;}
    if ($('#molweight5').val().length == 0){molweight5 = 0;}

    //add variables to the catscope
    catscope.dr_reaction_phase = dr_reaction_phase;
    catscope.temp = temp;
    catscope.pressure = pressure;
    catscope.R_rctr = R_rctr;
    catscope.L_bed = L_bed;
    catscope.R_p = R_p; //particle length
    catscope.R_p_inner = R_p_inner; //inner particle radius (for rings)
    catscope.L_p = L_p; //particle length for rings and cylinders
    catscope.rxn_rate = rxn_rate;
    catscope.rxn_enthalpy = rxn_enthalpy;
    catscope.dr_rxn_order = dr_rxn_order;
    catscope.rxn_activation_energy = rxn_activation_energy;
    catscope.rxn_conversion1 = rxn_conversion1;
    catscope.cat_rho_bulk = cat_rho_bulk;
    catscope.cat_void_frac = cat_void_frac;
    catscope.cat_thermal_cond = cat_thermal_cond;
    catscope.cat_surf_area = cat_surf_area;
    catscope.cat_pore_volume = cat_pore_volume;
    catscope.cat_pore_tortuosity = cat_pore_tortuosity;
    catscope.dr_cat_shape = dr_cat_shape;

    catscope.molfrac1 = molfrac1;
    catscope.molfrac2 = molfrac2;
    catscope.molfrac3 = molfrac3;
    catscope.molfrac4 = molfrac4;
    catscope.molfrac5 = molfrac5;
    catscope.fluidvisc1 = fluidvisc1;
    catscope.fluidvisc2 = fluidvisc2;
    catscope.fluidvisc3 = fluidvisc3;
    catscope.fluidvisc4 = fluidvisc4;
    catscope.fluidvisc5 = fluidvisc5;
    catscope.heatcapacity1 = heatcapacity1;
    catscope.heatcapacity2 = heatcapacity2;
    catscope.heatcapacity3 = heatcapacity3;
    catscope.heatcapacity4 = heatcapacity4;
    catscope.heatcapacity5 = heatcapacity5;
    catscope.thermalcond1 = thermalcond1;
    catscope.thermalcond2 = thermalcond2;
    catscope.thermalcond3 = thermalcond3;
    catscope.thermalcond4 = thermalcond4;
    catscope.thermalcond5 = thermalcond5;
    catscope.molweight1 = molweight1;
    catscope.molweight2 = molweight2;
    catscope.molweight3 = molweight3;
    catscope.molweight4 = molweight4;
    catscope.molweight5 = molweight5;

    //GAS specific
    catscope.difvol1 = difvol1;
    catscope.difvol2 = difvol2;
    catscope.difvol3 = difvol3;
    catscope.difvol4 = difvol4;
    catscope.difvol5 = difvol5;

    //LIQUID specific
    catscope.liq_density1 = liq_density1;
    catscope.liq_density2 = liq_density2;
    catscope.liq_density3 = liq_density3;
    catscope.liq_density4 = liq_density4;
    catscope.liq_density5 = liq_density5;
    catscope.molar_boil_vol1 = molar_boil_vol1;
    catscope.molar_boil_vol2 = molar_boil_vol2;
    catscope.molar_boil_vol3 = molar_boil_vol3;
    catscope.molar_boil_vol4 = molar_boil_vol4;
    catscope.molar_boil_vol5 = molar_boil_vol5;    
    catscope.wilke_assoc_phi2 = wilke_assoc_phi2; //no value for A=1
    catscope.wilke_assoc_phi3 = wilke_assoc_phi3;
    catscope.wilke_assoc_phi4 = wilke_assoc_phi4;
    catscope.wilke_assoc_phi5 = wilke_assoc_phi5;

    //effective diffusivity checkbox & override value
    catscope.ck_override_diffusivity = ck_override_diffusivity; //checkbox for override diffusivity
    catscope.diff_effective_override = diff_effective_override; //actual value to be used later as effective diffusivity via user input
    
    //do some conversion to SI for non-SI inputs
    catscope.cat_pore_volume_SI = math.eval('cat_pore_volume*1000',catscope);

    //predefine some catscope arrays
    catscope.molWeightArray = [catscope.molweight1, catscope.molweight2, catscope.molweight3, catscope.molweight4, catscope.molweight5]; //g per mol
    catscope.molFracArray = [catscope.molfrac1, catscope.molfrac2, catscope.molfrac3, catscope.molfrac4, catscope.molfrac5];
    catscope.diffusion_volume_Array = [catscope.difvol1,catscope.difvol2,catscope.difvol3,catscope.difvol4,catscope.difvol5];
    catscope.liqDensityArray = [catscope.liq_density1,catscope.liq_density2,catscope.liq_density3,catscope.liq_density4,catscope.liq_density5]; //kg per m^3
  });

  //////////////////////////////////////////////////////////////////////////////////
  // Function to add all of the outputs section into the "catscope" object for later use
  $(".initialize,#temp").on('keyup keydown change', function (){
    catscope.res_gasdens1 = 0;
    catscope.res_gasdens2 = 0;
    catscope.res_gasdens3 = 0;
    catscope.res_gasdens4 = 0;
    catscope.res_gasdens5 = 0;
    catscope.res_bulkconc1 = 0;
    catscope.limiting_reactant_check = 0;
    catscope.rxn_avg_bulk_concentration1 = 0;//not an output
    catscope.mass_flowrate = 0;
    catscope.molar_flowrate1 = 0; //not an output
    catscope.volumetric_flowrate = 0; //not an output
    catscope.mass_catalyst = 0;
    catscope.bed_volume = 0;
    catscope.cat_porosity = 0;
    catscope.cat_rho_particle = 0;
    catscope.cat_pore_radius = 0;
    catscope.cat_particle_vol = 0;
    catscope.cat_ext_area = 0;
    catscope.cat_interfacial_area = 0;
    catscope.avg_mw = 0;
    catscope.avg_cp = 0;
    catscope.avg_k_conduct = 0;
    catscope.avg_viscosity = 0;
    catscope.avg_density = 0;
    catscope.diff_mixture = 0;
    catscope.superf_mass_flux = 0;
    catscope.ndim_reynolds = 0;
    catscope.ndim_prandtl = 0;
    catscope.ndim_schmidt = 0;
    catscope.ndim_colburn = 0;
    catscope.ndim_massXfer_coeff = 0;
    catscope.ndim_sherwood = 0;
    catscope.ndim_heatXfer_coeff = 0;
    catscope.ndim_nusselt = 0;
    catscope.diff_knudsen = 0;
    catscope.diff_effective = 0;
    catscope.rxn_weisz_prater = 0;
    catscope.rxn_weisz_prater_inlet = 0;
    catscope.rxn_weisz_prater_outlet = 0;
    catscope.rxn_thiele = 0;
    catscope.rxn_thiele_inlet = 0;
    catscope.rxn_thiele_outlet = 0;
    catscope.rxn_eff_factor = 0;
    catscope.rxn_eff_factor_inlet = 0;
    catscope.rxn_eff_factor_outlet = 0;
    catscope.rxn_externalconc_grad = 0;
    catscope.rxn_externaltemp_grad = 0;
    catscope.rxn_internaltemp_grad = 0;
    catscope.ndim_prater = 0;
    catscope.rxn_intrinsic_rconst = 0;
    catscope.rxn_maxlimitingrate = 0;
    catscope.rxn_surfconcentration = 0;
    catscope.rxn_surftemperature = 0;
    catscope.axial_disp_coeff = 0;
    catscope.ndim_peclet = 0;
    catscope.ndim_bodenstein = 0;
    catscope.bed_pressure_drop = 0;
    catscope.ndim_BL_thickness = 0;
    catscope.cat_effective_radius_volequiv = 0; //not an output
    catscope.cat_effective_radius_ergun = 0; //not an output
    catscope.cat_effective_radius = 0; //not an output
    catscope.ndim_biot_solid = 0;//not an output    
  });

  //////////////////////////////////////////////////////////////////////////////////
  // Function to get the inputs to the Fuller method popup into catscope
  $(".initialize,#temp,#pressure").on('keyup keydown change click', function (){
    var fuller_C1 = $("#fuller_C1").val().toNum();
    var fuller_H1 = $("#fuller_H1").val().toNum();
    var fuller_O1 = $("#fuller_O1").val().toNum();
    var fuller_N1 = $("#fuller_N1").val().toNum();
    var fuller_S1 = $("#fuller_S1").val().toNum();
    var fuller_F1 = $("#fuller_F1").val().toNum();
    var fuller_Cl1 = $("#fuller_Cl1").val().toNum();
    var fuller_Br1 = $("#fuller_Br1").val().toNum();
    var fuller_I1 = $("#fuller_I1").val().toNum();
    var fuller_ar1 = $("#fuller_ar1").val().toNum();
    var fuller_het1 = $("#fuller_het1").val().toNum();
    
    var fuller_C2 = $("#fuller_C2").val().toNum();
    var fuller_H2 = $("#fuller_H2").val().toNum();
    var fuller_O2 = $("#fuller_O2").val().toNum();
    var fuller_N2 = $("#fuller_N2").val().toNum();
    var fuller_S2 = $("#fuller_S2").val().toNum();
    var fuller_F2 = $("#fuller_F2").val().toNum();
    var fuller_Cl2 = $("#fuller_Cl2").val().toNum();
    var fuller_Br2 = $("#fuller_Br2").val().toNum();
    var fuller_I2 = $("#fuller_I2").val().toNum();
    var fuller_ar2 = $("#fuller_ar2").val().toNum();
    var fuller_het2 = $("#fuller_het2").val().toNum();

    var fuller_C3 = $("#fuller_C3").val().toNum();
    var fuller_H3 = $("#fuller_H3").val().toNum();
    var fuller_O3 = $("#fuller_O3").val().toNum();
    var fuller_N3 = $("#fuller_N3").val().toNum();
    var fuller_S3 = $("#fuller_S3").val().toNum();
    var fuller_F3 = $("#fuller_F3").val().toNum();
    var fuller_Cl3 = $("#fuller_Cl3").val().toNum();
    var fuller_Br3 = $("#fuller_Br3").val().toNum();
    var fuller_I3 = $("#fuller_I3").val().toNum();
    var fuller_ar3 = $("#fuller_ar3").val().toNum();
    var fuller_het3 = $("#fuller_het3").val().toNum();

    var fuller_C4 = $("#fuller_C4").val().toNum();
    var fuller_H4 = $("#fuller_H4").val().toNum();
    var fuller_O4 = $("#fuller_O4").val().toNum();
    var fuller_N4 = $("#fuller_N4").val().toNum();
    var fuller_S4 = $("#fuller_S4").val().toNum();
    var fuller_F4 = $("#fuller_F4").val().toNum();
    var fuller_Cl4 = $("#fuller_Cl4").val().toNum();
    var fuller_Br4 = $("#fuller_Br4").val().toNum();
    var fuller_I4 = $("#fuller_I4").val().toNum();
    var fuller_ar4 = $("#fuller_ar4").val().toNum();
    var fuller_het4 = $("#fuller_het4").val().toNum();

    var fuller_C5 = $("#fuller_C5").val().toNum();
    var fuller_H5 = $("#fuller_H5").val().toNum();
    var fuller_O5 = $("#fuller_O5").val().toNum();
    var fuller_N5 = $("#fuller_N5").val().toNum();
    var fuller_S5 = $("#fuller_S5").val().toNum();
    var fuller_F5 = $("#fuller_F5").val().toNum();
    var fuller_Cl5 = $("#fuller_Cl5").val().toNum();
    var fuller_Br5 = $("#fuller_Br5").val().toNum();
    var fuller_I5 = $("#fuller_I5").val().toNum();
    var fuller_ar5 = $("#fuller_ar5").val().toNum();
    var fuller_het5 = $("#fuller_het5").val().toNum();

    var dr_molname_dvol1 = $("#dr_molname_dvol1 option:selected").attr("name");
    var dr_molname_dvol2 = $("#dr_molname_dvol2 option:selected").attr("name");
    var dr_molname_dvol3 = $("#dr_molname_dvol3 option:selected").attr("name");
    var dr_molname_dvol4 = $("#dr_molname_dvol4 option:selected").attr("name");
    var dr_molname_dvol5 = $("#dr_molname_dvol5 option:selected").attr("name");

    var fuller_Array1 = [fuller_C1,fuller_H1,fuller_O1,fuller_N1,fuller_S1,fuller_F1,fuller_Cl1,fuller_Br1,fuller_I1,fuller_ar1,fuller_het1];
    var fuller_Array2 = [fuller_C2,fuller_H2,fuller_O2,fuller_N2,fuller_S2,fuller_F2,fuller_Cl2,fuller_Br2,fuller_I2,fuller_ar2,fuller_het2];
    var fuller_Array3 = [fuller_C3,fuller_H3,fuller_O3,fuller_N3,fuller_S3,fuller_F3,fuller_Cl3,fuller_Br3,fuller_I3,fuller_ar3,fuller_het3];
    var fuller_Array4 = [fuller_C4,fuller_H4,fuller_O4,fuller_N4,fuller_S4,fuller_F4,fuller_Cl4,fuller_Br4,fuller_I4,fuller_ar4,fuller_het4];
    var fuller_Array5 = [fuller_C5,fuller_H5,fuller_O5,fuller_N5,fuller_S5,fuller_F5,fuller_Cl5,fuller_Br5,fuller_I5,fuller_ar5,fuller_het5];

    var dr_molname_Array = [dr_molname_dvol1,dr_molname_dvol2,dr_molname_dvol3,dr_molname_dvol4,dr_molname_dvol5];

    fuller_Array1 = replaceNaN(fuller_Array1);
    fuller_Array2 = replaceNaN(fuller_Array2);
    fuller_Array3 = replaceNaN(fuller_Array3);
    fuller_Array4 = replaceNaN(fuller_Array4);
    fuller_Array5 = replaceNaN(fuller_Array5);

    var fuller_Array1_mw = fuller_Array1.slice(0,-2);
    var fuller_Array2_mw = fuller_Array2.slice(0,-2);
    var fuller_Array3_mw = fuller_Array3.slice(0,-2);
    var fuller_Array4_mw = fuller_Array4.slice(0,-2);
    var fuller_Array5_mw = fuller_Array5.slice(0,-2);

    //add newly created arrays into the catscope object for later use
    catscope.fuller_Array1 = fuller_Array1;
    catscope.fuller_Array2 = fuller_Array2;
    catscope.fuller_Array3 = fuller_Array3;
    catscope.fuller_Array4 = fuller_Array4;
    catscope.fuller_Array5 = fuller_Array5;

    catscope.fuller_Array1_mw = fuller_Array1_mw;
    catscope.fuller_Array2_mw = fuller_Array2_mw;
    catscope.fuller_Array3_mw = fuller_Array3_mw;
    catscope.fuller_Array4_mw = fuller_Array4_mw;
    catscope.fuller_Array5_mw = fuller_Array5_mw;

    catscope.dr_molname_dvol1 = dr_molname_dvol1;
    catscope.dr_molname_dvol2 = dr_molname_dvol2;
    catscope.dr_molname_dvol3 = dr_molname_dvol3;
    catscope.dr_molname_dvol4 = dr_molname_dvol4;
    catscope.dr_molname_dvol5 = dr_molname_dvol5;

    catscope.dr_molname_Array = dr_molname_Array;
  });


  //////////////////////////////////////////////////////////////////////////////////
  //fuller diffusion volumes, MW, and molecular formulas for all five possible components
  $("#temp,#pressure").on('keyup keydown change click', function (){
    //first check if the gas field is selected
    if (catscope.dr_reaction_phase == "Gas Phase") {
      //id string of output field
      var outputdvolNames = ["#difvol1","#difvol2","#difvol3","#difvol4","#difvol5"];
      var outputdvolNames_popup = ["#fuller_dvol1","#fuller_dvol2","#fuller_dvol3","#fuller_dvol4","#fuller_dvol5"];
      var outputMWNames = ["#molweight1","#molweight2","#molweight3","#molweight4","#molweight5"];
      var outputMWNames_popup = ["#fuller_molweight1","#fuller_molweight2","#fuller_molweight3","#fuller_molweight4","#fuller_molweight5"];
      var outputformulaNames= ["#fuller_molformula1","#fuller_molformula2","#fuller_molformula3","#fuller_molformula4","#fuller_molformula5"];

      var MW_array = [12.011, 1.008, 15.999, 14.007, 32.066, 18.998, 35.453, 79.904, 126.905];
      var dvol_array = [15.9, 2.3, 6.1, 4.5, 22.9, 14.7, 21.0, 21.9, 29.8, -18.3, -18.3];
      catscope.MW_array = MW_array;
      catscope.dvol_array = dvol_array;


      // in the first section various properties are calculated for all components
      // REGARDLESS of "Custom" vs. non-Custom selection in dr_molname_ selection

      //perform calculation
      var fuller_molweight1 = math.eval('fuller_Array1_mw*transpose(MW_array)',catscope); //calculate molecular weight of "1" by multiplying against MW_array^T
      var fuller_molweight2 = math.eval('fuller_Array2_mw*transpose(MW_array)',catscope);
      var fuller_molweight3 = math.eval('fuller_Array3_mw*transpose(MW_array)',catscope);
      var fuller_molweight4 = math.eval('fuller_Array4_mw*transpose(MW_array)',catscope);
      var fuller_molweight5 = math.eval('fuller_Array5_mw*transpose(MW_array)',catscope);

      var fuller_molformula1 = fullerArrayToFormula(catscope.fuller_Array1_mw); //convert array of numbers into formula string
      var fuller_molformula2 = fullerArrayToFormula(catscope.fuller_Array2_mw);
      var fuller_molformula3 = fullerArrayToFormula(catscope.fuller_Array3_mw);
      var fuller_molformula4 = fullerArrayToFormula(catscope.fuller_Array4_mw);
      var fuller_molformula5 = fullerArrayToFormula(catscope.fuller_Array5_mw);

      var fuller_dvol1 = math.eval('fuller_Array1*transpose(dvol_array)',catscope);
      var fuller_dvol2 = math.eval('fuller_Array2*transpose(dvol_array)',catscope);
      var fuller_dvol3 = math.eval('fuller_Array3*transpose(dvol_array)',catscope);
      var fuller_dvol4 = math.eval('fuller_Array4*transpose(dvol_array)',catscope);
      var fuller_dvol5 = math.eval('fuller_Array5*transpose(dvol_array)',catscope);

      var fuller_molweight_Array = [fuller_molweight1,fuller_molweight2,fuller_molweight3,fuller_molweight4,fuller_molweight5];
      var fuller_dvol_Array = [fuller_dvol1,fuller_dvol2,fuller_dvol3,fuller_dvol4,fuller_dvol5];
      var fuller_molformula_Array = [fuller_molformula1,fuller_molformula2,fuller_molformula3,fuller_molformula4,fuller_molformula5];

      //add result to scope
      catscope.fuller_molweight1 = fuller_molweight1;
      catscope.fuller_molweight2 = fuller_molweight2;
      catscope.fuller_molweight3 = fuller_molweight3;
      catscope.fuller_molweight4 = fuller_molweight4;
      catscope.fuller_molweight5 = fuller_molweight5;

      catscope.fuller_molweight_Array = fuller_molweight_Array;
      catscope.fuller_dvol_Array = fuller_dvol_Array;
      catscope.fuller_molformula_Array = fuller_molformula_Array;

      //define some arrays 
      var predefdvolArray = [18.5,16.3,19.7,13.1,18.0,26.9,6.1,2.7,16.2,35.9,20.7,38.4,69.0,41.8];
      var predefdvolNamesArray = ["N2","O2","Air","H2O","CO","CO2","H2","He","Ar","N2O","NH3","Cl2","Br2","SO2"];
      var predefdvolMWArray = [28.014,31.998,28.966,18.016,28.01,44.009,2.016,4.0026,39.948,44.013,17.031,70.906,159.808,64.064];

      //use alternate method for dr_molname
      $.each(catscope.dr_molname_Array, function(index,value){
        var j = predefdvolNamesArray.indexOf(value);

        if (!predefdvolNamesArray[j]) { //check if the value is NOT in the Array, specifically for "Custom" molecules
          writeOut(outputformulaNames[index],fuller_molformula_Array[index])
          if (fuller_molweight_Array[index] != 0 && fuller_dvol_Array[index] != 0) { //ONLY write the values if they are NOT zero
            writeOut(outputMWNames[index],fuller_molweight_Array[index])
            writeOut(outputMWNames_popup[index],fuller_molweight_Array[index])
            writeOut(outputdvolNames[index],fuller_dvol_Array[index])
            writeOut(outputdvolNames_popup[index],fuller_dvol_Array[index])
          }
        } else { //else the value is in the array, then use predefined mol weights / formulas / and diffusion volumes
          writeOut(outputformulaNames[index],predefdvolNamesArray[j])
          writeOut(outputMWNames[index],predefdvolMWArray[j])
          writeOut(outputMWNames_popup[index],predefdvolMWArray[j])
          writeOut(outputdvolNames[index],predefdvolArray[j])
          writeOut(outputdvolNames_popup[index],predefdvolArray[j])
          catscope.fuller_molweight_Array[index] = predefdvolMWArray[j];
          catscope.fuller_dvol_Array[index] = predefdvolArray[j];
        }
      });


      // at this point the relevant mol weights / formulas / and diffusion volumes have actually been written to the user interface cell
      // since we need to use the actual values later -- it would be best to read them back into the catscope object for later use


      for (i in catscope.molWeightArray) {
        if (catscope.fuller_molweight_Array[i] > 0) {
          catscope.molWeightArray[i] = catscope.fuller_molweight_Array[i];
        } else {
          //do nothing
        }
      }

      for (i in catscope.diffusion_volume_Array) {
        if (catscope.fuller_dvol_Array[i] > 0) {
          catscope.diffusion_volume_Array[i] = catscope.fuller_dvol_Array[i];//there can be zeros here, which is checked and corrected for later
        } else {
          //do nothing
        }
      }

    }
  });

  //////////////////////////////////////////////////////////////////////////////////
  //calculate binary diffusivities for all 4 possible A dominant pairs (1-2,1-3,1-4,1-5) and mixture diffusivity for GAS and LIQUID
  $("#temp,#pressure").on('keyup keydown change click', function (){
    var molTest = doesItSumToOne(catscope.molFracArray); //currently uses >= 0.995 = 1
    catscope.molTest = molTest;

    //then check if the gas field is selected
    if (catscope.dr_reaction_phase == "Gas Phase") {
      //id string of output field
      var diff_mixture_out = "#diff_mixture"; //output in m^2/s

      catscope.binary_diff_Array = [];

      for (var i = 1; i <= 4; i++) {
        var j = i - 1;
        catscope.binary_diff_Array[j] = fullerBinaryDiff(catscope.molWeightArray[0],catscope.molWeightArray[i],catscope.temp,catscope.pressure,catscope.diffusion_volume_Array[0],catscope.diffusion_volume_Array[i]);  
      }

      catscope.binary_diff_Array_noInf = $.extend( true, [], catscope.binary_diff_Array);
      var removeInfIndices = findInfIndices(catscope.binary_diff_Array_noInf);

      catscope.molFracArray_no_A_no_Inf = $.extend( true, [], catscope.molFracArray); //first duplicate array -- special syntax breaks inheritance problems
      catscope.molFracArray_no_A_no_Inf.shift(); // then delete first element by using shift

      for (i in removeInfIndices) {
        var j = removeInfIndices[i] - i;
        catscope.binary_diff_Array_noInf.splice(j,1); //remove elements with diffusion of Infinity -- indicating no input for molecule information
        catscope.molFracArray_no_A_no_Inf.splice(j,1); //remove corresponding elements of molFracArray
      } 


      catscope.self_diff_coeffA = fullerBinaryDiff(catscope.molWeightArray[0],catscope.molWeightArray[0],catscope.temp,catscope.pressure,catscope.diffusion_volume_Array[0],catscope.diffusion_volume_Array[0]);  

      if (catscope.molTest == true) { //logical test for if mol fractions add to one
        var numerator = math.eval('1-molfrac1',catscope);
        var denominator = math.eval('sum(molFracArray_no_A_no_Inf./binary_diff_Array_noInf)',catscope); //perform elementwise division, then sum elements of array
        var diff_mixture = math.divide(numerator,denominator);
        
        if (catscope.molfrac1 == 1) {
          catscope.diff_mixture = catscope.self_diff_coeffA;
          writeOut(diff_mixture_out,catscope.self_diff_coeffA); //using a self diffusion coefficient
        } else {
          catscope.diff_mixture = diff_mixture;
          writeOut(diff_mixture_out,diff_mixture);
        }
      } else {
        writeOut(diff_mixture_out,'Sum of Mol Frac. not 1');
      }  
    } 

    //separate code for liquid phase mixture diffusivity is later
  });
  

  //////////////////////////////////////////////////////////////////////////////////
  //get Le Bas parameters to calculate molar volumes / mol. weight / formula for liquids
  $("#button_lebas_vb_calculate,#temp").on('keyup keydown change click', function (){
    if(catscope.dr_reaction_phase == "Liquid Phase") { //check if the selected phase is correct to perform these calculations
            
      var lebas_C1 = $("#lebas_C1").val().toNum(); //get Le Bas method values for liquid molar volume calculation
      var lebas_H1 = $("#lebas_H1").val().toNum();
      var lebas_O1 = $("#lebas_O1").val().toNum();
      var lebas_MeEs_O1 = $("#lebas_MeEs_O1").val().toNum();
      var lebas_EtEs_O1 = $("#lebas_EtEs_O1").val().toNum();
      var lebas_HiEs_O1 = $("#lebas_HiEs_O1").val().toNum();
      var lebas_Ac_O1 = $("#lebas_Ac_O1").val().toNum();
      var lebas_tospn_O1 = $("#lebas_tospn_O1").val().toNum();
      var lebas_dbl_N1 = $("#lebas_dbl_N1").val().toNum();
      var lebas_pri_N1 = $("#lebas_pri_N1").val().toNum();
      var lebas_sec_N1 = $("#lebas_sec_N1").val().toNum();
      var lebas_Br1 = $("#lebas_Br1").val().toNum();  
      var lebas_Cl1 = $("#lebas_Cl1").val().toNum();
      var lebas_F1 = $("#lebas_F1").val().toNum();
      var lebas_I1 = $("#lebas_I1").val().toNum();
      var lebas_S1 = $("#lebas_S1").val().toNum();
      var lebas_ringThr1 = $("#lebas_ringThr1").val().toNum();
      var lebas_ringFo1 = $("#lebas_ringFo1").val().toNum();
      var lebas_ringFi1 = $("#lebas_ringFi1").val().toNum();
      var lebas_ringSi1 = $("#lebas_ringSi1").val().toNum();
      var lebas_nphth1 = $("#lebas_nphth1").val().toNum();
      var lebas_anthr1 = $("#lebas_anthr1").val().toNum();

      var lebas_C2 = $("#lebas_C2").val().toNum(); //molecule 2
      var lebas_H2 = $("#lebas_H2").val().toNum();
      var lebas_O2 = $("#lebas_O2").val().toNum();
      var lebas_MeEs_O2 = $("#lebas_MeEs_O2").val().toNum();
      var lebas_EtEs_O2 = $("#lebas_EtEs_O2").val().toNum();
      var lebas_HiEs_O2 = $("#lebas_HiEs_O2").val().toNum();
      var lebas_Ac_O2 = $("#lebas_Ac_O2").val().toNum();
      var lebas_tospn_O2 = $("#lebas_tospn_O2").val().toNum();
      var lebas_dbl_N2 = $("#lebas_dbl_N2").val().toNum();
      var lebas_pri_N2 = $("#lebas_pri_N2").val().toNum();
      var lebas_sec_N2 = $("#lebas_sec_N2").val().toNum();
      var lebas_Br2 = $("#lebas_Br2").val().toNum();  
      var lebas_Cl2 = $("#lebas_Cl2").val().toNum();
      var lebas_F2 = $("#lebas_F2").val().toNum();
      var lebas_I2 = $("#lebas_I2").val().toNum();
      var lebas_S2 = $("#lebas_S2").val().toNum();
      var lebas_ringThr2 = $("#lebas_ringThr2").val().toNum();
      var lebas_ringFo2 = $("#lebas_ringFo2").val().toNum();
      var lebas_ringFi2 = $("#lebas_ringFi2").val().toNum();
      var lebas_ringSi2 = $("#lebas_ringSi2").val().toNum();
      var lebas_nphth2 = $("#lebas_nphth2").val().toNum();
      var lebas_anthr2 = $("#lebas_anthr2").val().toNum();

      var lebas_C3 = $("#lebas_C3").val().toNum(); //molecule 3
      var lebas_H3 = $("#lebas_H3").val().toNum();
      var lebas_O3 = $("#lebas_O3").val().toNum();
      var lebas_MeEs_O3 = $("#lebas_MeEs_O3").val().toNum();
      var lebas_EtEs_O3 = $("#lebas_EtEs_O3").val().toNum();
      var lebas_HiEs_O3 = $("#lebas_HiEs_O3").val().toNum();
      var lebas_Ac_O3 = $("#lebas_Ac_O3").val().toNum();
      var lebas_tospn_O3 = $("#lebas_tospn_O3").val().toNum();
      var lebas_dbl_N3 = $("#lebas_dbl_N3").val().toNum();
      var lebas_pri_N3 = $("#lebas_pri_N3").val().toNum();
      var lebas_sec_N3 = $("#lebas_sec_N3").val().toNum();
      var lebas_Br3 = $("#lebas_Br3").val().toNum();  
      var lebas_Cl3 = $("#lebas_Cl3").val().toNum();
      var lebas_F3 = $("#lebas_F3").val().toNum();
      var lebas_I3 = $("#lebas_I3").val().toNum();
      var lebas_S3 = $("#lebas_S3").val().toNum();
      var lebas_ringThr3 = $("#lebas_ringThr3").val().toNum();
      var lebas_ringFo3 = $("#lebas_ringFo3").val().toNum();
      var lebas_ringFi3 = $("#lebas_ringFi3").val().toNum();
      var lebas_ringSi3 = $("#lebas_ringSi3").val().toNum();
      var lebas_nphth3 = $("#lebas_nphth3").val().toNum();
      var lebas_anthr3 = $("#lebas_anthr3").val().toNum();

      var lebas_C4 = $("#lebas_C4").val().toNum(); //molecule 4
      var lebas_H4 = $("#lebas_H4").val().toNum();
      var lebas_O4 = $("#lebas_O4").val().toNum();
      var lebas_MeEs_O4 = $("#lebas_MeEs_O4").val().toNum();
      var lebas_EtEs_O4 = $("#lebas_EtEs_O4").val().toNum();
      var lebas_HiEs_O4 = $("#lebas_HiEs_O4").val().toNum();
      var lebas_Ac_O4 = $("#lebas_Ac_O4").val().toNum();
      var lebas_tospn_O4 = $("#lebas_tospn_O4").val().toNum();
      var lebas_dbl_N4 = $("#lebas_dbl_N4").val().toNum();
      var lebas_pri_N4 = $("#lebas_pri_N4").val().toNum();
      var lebas_sec_N4 = $("#lebas_sec_N4").val().toNum();
      var lebas_Br4 = $("#lebas_Br4").val().toNum();  
      var lebas_Cl4 = $("#lebas_Cl4").val().toNum();
      var lebas_F4 = $("#lebas_F4").val().toNum();
      var lebas_I4 = $("#lebas_I4").val().toNum();
      var lebas_S4 = $("#lebas_S4").val().toNum();
      var lebas_ringThr4 = $("#lebas_ringThr4").val().toNum();
      var lebas_ringFo4 = $("#lebas_ringFo4").val().toNum();
      var lebas_ringFi4 = $("#lebas_ringFi4").val().toNum();
      var lebas_ringSi4 = $("#lebas_ringSi4").val().toNum();
      var lebas_nphth4 = $("#lebas_nphth4").val().toNum();
      var lebas_anthr4 = $("#lebas_anthr4").val().toNum();      

      var lebas_C5 = $("#lebas_C5").val().toNum(); //molecule 5
      var lebas_H5 = $("#lebas_H5").val().toNum();
      var lebas_O5 = $("#lebas_O5").val().toNum();
      var lebas_MeEs_O5 = $("#lebas_MeEs_O5").val().toNum();
      var lebas_EtEs_O5 = $("#lebas_EtEs_O5").val().toNum();
      var lebas_HiEs_O5 = $("#lebas_HiEs_O5").val().toNum();
      var lebas_Ac_O5 = $("#lebas_Ac_O5").val().toNum();
      var lebas_tospn_O5 = $("#lebas_tospn_O5").val().toNum();
      var lebas_dbl_N5 = $("#lebas_dbl_N5").val().toNum();
      var lebas_pri_N5 = $("#lebas_pri_N5").val().toNum();
      var lebas_sec_N5 = $("#lebas_sec_N5").val().toNum();
      var lebas_Br5 = $("#lebas_Br5").val().toNum();  
      var lebas_Cl5 = $("#lebas_Cl5").val().toNum();
      var lebas_F5 = $("#lebas_F5").val().toNum();
      var lebas_I5 = $("#lebas_I5").val().toNum();
      var lebas_S5 = $("#lebas_S5").val().toNum();
      var lebas_ringThr5 = $("#lebas_ringThr5").val().toNum();
      var lebas_ringFo5 = $("#lebas_ringFo5").val().toNum();
      var lebas_ringFi5 = $("#lebas_ringFi5").val().toNum();
      var lebas_ringSi5 = $("#lebas_ringSi5").val().toNum();
      var lebas_nphth5 = $("#lebas_nphth5").val().toNum();
      var lebas_anthr5 = $("#lebas_anthr5").val().toNum();

      //construct arrays based on above variables for later use in calcualting molar volume, molar weight, and molar formula
      var lebas_Array1 = [lebas_C1,lebas_H1,lebas_O1,lebas_MeEs_O1,lebas_EtEs_O1,lebas_HiEs_O1,lebas_Ac_O1,lebas_tospn_O1,lebas_dbl_N1,lebas_pri_N1,lebas_sec_N1,lebas_Br1,lebas_Cl1,lebas_F1,lebas_I1,lebas_S1,lebas_ringThr1,lebas_ringFo1,lebas_ringFi1,lebas_ringSi1,lebas_nphth1,lebas_anthr1];
      var lebas_Array2 = [lebas_C2,lebas_H2,lebas_O2,lebas_MeEs_O2,lebas_EtEs_O2,lebas_HiEs_O2,lebas_Ac_O2,lebas_tospn_O2,lebas_dbl_N2,lebas_pri_N2,lebas_sec_N2,lebas_Br2,lebas_Cl2,lebas_F2,lebas_I2,lebas_S2,lebas_ringThr2,lebas_ringFo2,lebas_ringFi2,lebas_ringSi2,lebas_nphth2,lebas_anthr2];
      var lebas_Array3 = [lebas_C3,lebas_H3,lebas_O3,lebas_MeEs_O3,lebas_EtEs_O3,lebas_HiEs_O3,lebas_Ac_O3,lebas_tospn_O3,lebas_dbl_N3,lebas_pri_N3,lebas_sec_N3,lebas_Br3,lebas_Cl3,lebas_F3,lebas_I3,lebas_S3,lebas_ringThr3,lebas_ringFo3,lebas_ringFi3,lebas_ringSi3,lebas_nphth3,lebas_anthr3];
      var lebas_Array4 = [lebas_C4,lebas_H4,lebas_O4,lebas_MeEs_O4,lebas_EtEs_O4,lebas_HiEs_O4,lebas_Ac_O4,lebas_tospn_O4,lebas_dbl_N4,lebas_pri_N4,lebas_sec_N4,lebas_Br4,lebas_Cl4,lebas_F4,lebas_I4,lebas_S4,lebas_ringThr4,lebas_ringFo4,lebas_ringFi4,lebas_ringSi4,lebas_nphth4,lebas_anthr4];
      var lebas_Array5 = [lebas_C5,lebas_H5,lebas_O5,lebas_MeEs_O5,lebas_EtEs_O5,lebas_HiEs_O5,lebas_Ac_O5,lebas_tospn_O5,lebas_dbl_N5,lebas_pri_N5,lebas_sec_N5,lebas_Br5,lebas_Cl5,lebas_F5,lebas_I5,lebas_S5,lebas_ringThr5,lebas_ringFo5,lebas_ringFi5,lebas_ringSi5,lebas_nphth5,lebas_anthr5];

      lebas_Array1 = replaceNaN(lebas_Array1);
      lebas_Array2 = replaceNaN(lebas_Array2);
      lebas_Array3 = replaceNaN(lebas_Array3);
      lebas_Array4 = replaceNaN(lebas_Array4);
      lebas_Array5 = replaceNaN(lebas_Array5);

      var lebas_Array1_mw = lebas_Array1.slice(0,-6); //
      var lebas_Array2_mw = lebas_Array2.slice(0,-6);
      var lebas_Array3_mw = lebas_Array3.slice(0,-6);
      var lebas_Array4_mw = lebas_Array4.slice(0,-6);
      var lebas_Array5_mw = lebas_Array5.slice(0,-6);

      catscope.lebas_Array1 = lebas_Array1;
      catscope.lebas_Array2 = lebas_Array2;
      catscope.lebas_Array3 = lebas_Array3;
      catscope.lebas_Array4 = lebas_Array4;
      catscope.lebas_Array5 = lebas_Array5;

      catscope.lebas_Array1_mw = lebas_Array1_mw;
      catscope.lebas_Array2_mw = lebas_Array2_mw;
      catscope.lebas_Array3_mw = lebas_Array3_mw;
      catscope.lebas_Array4_mw = lebas_Array4_mw;
      catscope.lebas_Array5_mw = lebas_Array5_mw;

      var lebas_MW_array = [12.011,1.008,15.999,15.999,15.999,15.999,15.999,15.999,14.007,14.007,14.007,79.904,35.453,18.998,126.905,32.066]; //has duplicate entries that match with duplicates in array
      catscope.lebas_MW_array = lebas_MW_array;

      var lebas_molarvb_array = [14.8,3.7,7.4,9.1,9.9,11,12,8.3,15.6,10.5,12,27,24.6,8.7,37,25.6,-6.0,-8.5,-11.5,-15.0,-30.0,-47.5]; //has all entries for all molar volume contributions
      catscope.lebas_molarvb_array = lebas_molarvb_array;

      var lebas_molweight1 = math.eval('lebas_Array1_mw*transpose(lebas_MW_array)',catscope); //calculate molecular weight of "1" by multiplying against MW_array^T
      var lebas_molweight2 = math.eval('lebas_Array2_mw*transpose(lebas_MW_array)',catscope); //units are g/mpl for all of these
      var lebas_molweight3 = math.eval('lebas_Array3_mw*transpose(lebas_MW_array)',catscope);
      var lebas_molweight4 = math.eval('lebas_Array4_mw*transpose(lebas_MW_array)',catscope);
      var lebas_molweight5 = math.eval('lebas_Array5_mw*transpose(lebas_MW_array)',catscope);

      var lebas_vb1 = math.eval('lebas_Array1*transpose(lebas_molarvb_array)',catscope); //calculate molar volume @ boiling of "1" by multiplying against the molar volume array^T
      var lebas_vb2 = math.eval('lebas_Array2*transpose(lebas_molarvb_array)',catscope); //units are cm^3 per mol for all of these
      var lebas_vb3 = math.eval('lebas_Array3*transpose(lebas_molarvb_array)',catscope);
      var lebas_vb4 = math.eval('lebas_Array4*transpose(lebas_molarvb_array)',catscope);
      var lebas_vb5 = math.eval('lebas_Array5*transpose(lebas_molarvb_array)',catscope);

      //add only lebas_vb1 to catscope to be used later
      catscope.lebas_vb1 = lebas_vb1;

      var lebas_molformula1 = lebasArrayToFormula(catscope.lebas_Array1_mw); //convert array of numbers into formula string
      var lebas_molformula2 = lebasArrayToFormula(catscope.lebas_Array2_mw); 
      var lebas_molformula3 = lebasArrayToFormula(catscope.lebas_Array3_mw); 
      var lebas_molformula4 = lebasArrayToFormula(catscope.lebas_Array4_mw); 
      var lebas_molformula5 = lebasArrayToFormula(catscope.lebas_Array5_mw); 

      var lebas_molweight_Array = [lebas_molweight1,lebas_molweight2,lebas_molweight3,lebas_molweight4,lebas_molweight5];
      var lebas_vb_Array = [lebas_vb1,lebas_vb2,lebas_vb3,lebas_vb4,lebas_vb5];
      var fuller_molformula_Array = [lebas_molformula1,lebas_molformula2,lebas_molformula3,lebas_molformula4,lebas_molformula5];

      catscope.lebas_molweight_Array = lebas_molweight_Array;
      catscope.lebas_vb_Array = lebas_vb_Array;
      catscope.fuller_molformula_Array = fuller_molformula_Array;
      
      var outputVbNames = ["#molar_boil_vol1","#molar_boil_vol2","#molar_boil_vol3","#molar_boil_vol4","#molar_boil_vol5"];
      var outputVbNames_popup = ["#lebas_vb1","#lebas_vb2","#lebas_vb3","#lebas_vb4","#lebas_vb5"];
      var outputMWNames = ["#molweight1","#molweight2","#molweight3","#molweight4","#molweight5"];
      var outputMWNames_popup = ["#lebas_molweight1","#lebas_molweight2","#lebas_molweight3","#lebas_molweight4","#lebas_molweight5"];
      var outputformulaNames= ["#lebas_molformula1","#lebas_molformula2","#lebas_molformula3","#lebas_molformula4","#lebas_molformula5"];
      

      for (i in catscope.molWeightArray) {
        if (catscope.lebas_molweight_Array[i] > 0) {
          catscope.molWeightArray[i] = catscope.lebas_molweight_Array[i];
        } else {
          //do nothing
        }
      }

      for (i in catscope.molar_boil_vol_Array) {
        if (catscope.lebas_vb_Array[i] > 0) {
          catscope.molar_boil_vol_Array[i] = catscope.lebas_vb_Array[i];
        } else {
          //do nothing
        }
      }


      $.each(catscope.lebas_vb_Array, function(index,value){//output results of formula, Mol. weight, and molar volume @ T_b
        writeOut(outputformulaNames[index],fuller_molformula_Array[index])
        if (lebas_molweight_Array[index] != 0 && lebas_vb_Array[index] != 0) { //ONLY write the values if they are NOT zero
          writeOut(outputMWNames[index],lebas_molweight_Array[index])
          writeOut(outputMWNames_popup[index],lebas_molweight_Array[index])
          writeOut(outputVbNames[index],lebas_vb_Array[index])
          writeOut(outputVbNames_popup[index],lebas_vb_Array[index])
        }
      });
    } else {
      //do nothing
    }
  });

  //////////////////////////////////////////////////////////////////////////////////
  //mixture diffusivity, molecule radius, pore constriction factor for liquids
  $("#temp,#pressure,#molweight3").on('keyup keydown change', function (){
    if(catscope.dr_reaction_phase == "Liquid Phase") { //check if the selected phase is correct to perform these calculations
      var diff_mixture_out = "#diff_mixture"; //output in m^2/s

      //dont need association factor for component 1 with itself
      var wilke_assoc_phi2 = $("#wilke_assoc_phi2").val().toNum();
      var wilke_assoc_phi3 = $("#wilke_assoc_phi3").val().toNum();
      var wilke_assoc_phi4 = $("#wilke_assoc_phi4").val().toNum();
      var wilke_assoc_phi5 = $("#wilke_assoc_phi5").val().toNum();

      catscope.wilke_assoc_phi2 = wilke_assoc_phi2;
      catscope.wilke_assoc_phi3 = wilke_assoc_phi3;
      catscope.wilke_assoc_phi4 = wilke_assoc_phi4;
      catscope.wilke_assoc_phi5 = wilke_assoc_phi5;

      catscope.wilke_assoc_Array = [catscope.wilke_assoc_phi2,catscope.wilke_assoc_phi3,catscope.wilke_assoc_phi4,catscope.wilke_assoc_phi5];
      catscope.wilke_assoc_Array = replaceNaN(catscope.wilke_assoc_Array); //replace NaN with zeros

      catscope.molFracArray_no_A = $.extend( true, [], catscope.molFracArray); //duplicate existing object
      catscope.molFracArray_no_A.shift() //remove first element 'A'

      catscope.molWeightArray_no_A = $.extend( true, [], catscope.molWeightArray);
      catscope.molWeightArray_no_A.shift() //remove first element 'A'

      var perkins_phi_M = math.eval('(1/(1-molfrac1))*sum(molFracArray_no_A.*wilke_assoc_Array.*molWeightArray_no_A)',catscope); //just manually specifying equation for clarity
      catscope.perkins_phi_M = perkins_phi_M;

      catscope.avg_viscosity_nonSI = math.eval('avg_viscosity*1000',catscope); //convert from kg/m/s to centipoise 

      var diff_mixture_nonSI = math.eval('7.4e-8*perkins_phi_M^0.5*temp/avg_viscosity_nonSI/molar_boil_vol1^0.6',catscope); //hardcoded to component 1
      catscope.diff_mixture_nonSI = diff_mixture_nonSI;
      catscope.diff_mixture = math.eval('diff_mixture_nonSI/1e4',catscope); //convert from cm^2/s to m^2/s

      var molecule_radius1 = math.eval('1e8*(molar_boil_vol1/6.022e23*3/4/pi)^(1/3)',catscope); //output units are in Angstroms, (molar_boil_vol1 is cm^3/mol)
      catscope.molecule_radius1 = molecule_radius1;

      var pore_constriction_factor = math.eval('10^(-2*molecule_radius1/cat_pore_radius)',catscope); //used later for effective diffusivity calculation
      catscope.pore_constriction_factor = pore_constriction_factor;
      
      if (catscope.molTest == true) { //check if mol fractions add to 1 or not
        if (catscope.molfrac1 == 1) {
          writeOut(diff_mixture_out,'Mol Frac. of A = 1');
        } else {
          writeOut(diff_mixture_out,catscope.diff_mixture);
        }
      } else {
        writeOut(diff_mixture_out,'Sum of Mol Frac. not 1');
      }

    } else {
      //do nothing
    }
  });

  //////////////////////////////////////////////////////////////////////////////////
  //thermal conductivity mixing function for liquids
  $("#temp,#pressure,#molweight3").on('keyup keydown change', function (){
    if(catscope.dr_reaction_phase == "Liquid Phase") { //check if the selected phase is correct to perform these calculations

    }

  });


  //////////////////////////////////////////////////////////////////////////////////
  //ideal gas density for all five possible components
  $("#molweight1,#molweight2,#molweight3,#molweight4,#molweight5,#temp,#pressure").on('keyup keydown change', function (){
    //id string of output field
    var res_gasdens1_out = "#res_gasdens1"; //output in kg per m^3
    var res_gasdens2_out = "#res_gasdens2"; //output in kg per m^3
    var res_gasdens3_out = "#res_gasdens3"; //output in kg per m^3
    var res_gasdens4_out = "#res_gasdens4"; //output in kg per m^3
    var res_gasdens5_out = "#res_gasdens5"; //output in kg per m^3

    //perform calculation
    var res_gasdens1 = idealGasDensity(catscope.molweight1,catscope.temp,catscope.pressure);
    var res_gasdens2 = idealGasDensity(catscope.molweight2,catscope.temp,catscope.pressure);
    var res_gasdens3 = idealGasDensity(catscope.molweight3,catscope.temp,catscope.pressure);
    var res_gasdens4 = idealGasDensity(catscope.molweight4,catscope.temp,catscope.pressure);
    var res_gasdens5 = idealGasDensity(catscope.molweight5,catscope.temp,catscope.pressure);

    //add result to scope
    catscope.res_gasdens1 = res_gasdens1;
    catscope.res_gasdens2 = res_gasdens2;
    catscope.res_gasdens3 = res_gasdens3;
    catscope.res_gasdens4 = res_gasdens4;
    catscope.res_gasdens5 = res_gasdens5;
    
    //actually write to the appropriate field
    writeOut(res_gasdens1_out,res_gasdens1);
    writeOut(res_gasdens2_out,res_gasdens2);
    writeOut(res_gasdens3_out,res_gasdens3);
    writeOut(res_gasdens4_out,res_gasdens4);
    writeOut(res_gasdens5_out,res_gasdens5);
  });

  //////////////////////////////////////////////////////////////////////////////////
  //function for average GAS/LIQUID density and average molecular weight
  $("#molweight3,#temp,#pressure").on('keyup keydown change', function (){
    //id string of output field
    var avg_density_out = "#avg_density"; //output in kg per m^3
    var avg_mw_out = "#avg_mw";

    if (catscope.molTest == 1) { //logical test for if mol fractions add to one
      var avg_mw = molFracMixingFunction(catscope.molFracArray,catscope.molWeightArray);
      catscope.avg_mw = avg_mw;

      //actually write the results to the appropriate fields
      writeOut(avg_mw_out,avg_mw);

      if (catscope.dr_reaction_phase == "Gas Phase") {
        var avg_density = idealGasDensity(catscope.avg_mw,catscope.temp,catscope.pressure);
        catscope.avg_density = avg_density;

        //actually write the results to the appropriate fields
        writeOut(avg_density_out,avg_density);
        
      } else if (catscope.dr_reaction_phase == "Liquid Phase") {
        var density_denominator = math.eval('molFracArray.*molWeightArray./liqDensityArray',catscope); //this will generate NaN values in cases without all 5 components specified
        density_denominator = replaceNaN(density_denominator);//this repalces NaN values in this array with Zeros
        var density_numerator = math.eval('molFracArray*transpose(molWeightArray)',catscope);

        var avg_density = math.divide(density_numerator,math.sum(density_denominator));
        catscope.avg_density = avg_density;

        //actually write the results to the appropriate fields
        writeOut(avg_density_out,avg_density);
      }
    } else {
      writeOut(avg_density_out,'Sum of Mol Frac. not 1');
      writeOut(avg_mw_out,'Sum of Mol Frac. not 1');
    }  
  });

  //////////////////////////////////////////////////////////////////////////////////////  
  //////////////////////////////////////////////////////////////////////////////////////
  /// from now on NOT going to mess with change triggers -- the ones above were altered
  //////////////////////////////////////////////////////////////////////////////////////  
  //////////////////////////////////////////////////////////////////////////////////////  


  //////////////////////////////////////////////////////////////////////////////  
  // function for external surface area, bed tortuosity, Peclet_f from Gunn et. al., Peclet_r_inf, and Schlunder_C
  $("#R_p,#L_p,#R_p_inner,#dr_cat_shape,.initialize").on('keyup keydown change', function (){
    //id string of output field
    var cat_ext_area_out = "#cat_ext_area";
    var cat_particle_vol_out = "#cat_particle_vol";

    var cat_ext_area;
    var cat_particle_vol;
    var bed_tortuosity;
    var ndim_peclet_f;
    var ndim_peclet_r_inf;
    var schlunder_C;


    if (catscope.dr_cat_shape == "Spheres"){
      cat_ext_area = math.eval('4*pi*R_p^2',catscope);
      cat_particle_vol = math.eval('4/3*pi*R_p^3',catscope);
      bed_tortuosity = 1.4;
      ndim_peclet_f = math.eval('40 - 29*exp(-7/ndim_reynolds)',catscope);
      ndim_peclet_r_inf = 11;
      schlunder_C = 1.25;
      ndim_biot_solid = math.eval('2.41 + 0.156*(R_rctr/cat_effective_radius_volequiv - 1)^2',catscope);
    } else if (catscope.dr_cat_shape == "Cylinders"){
      cat_ext_area = math.eval('2*pi*R_p*(L_p + R_p)',catscope);
      cat_particle_vol = math.eval('pi*R_p^2*L_p',catscope);
      bed_tortuosity = 1.93;
      ndim_peclet_f = math.eval('11 - 4*exp(-7/ndim_reynolds)',catscope);
      ndim_peclet_r_inf = 8;
      schlunder_C = 2.5;
      ndim_biot_solid = math.eval('0.48 + 0.192*(R_rctr/cat_effective_radius_volequiv - 1)^2',catscope);
    } else if (catscope.dr_cat_shape == "Rings"){
      bed_tortuosity = 1.8;
      ndim_peclet_f = math.eval('9 - 3.3*exp(-7/ndim_reynolds)',catscope);
      ndim_peclet_r_inf = 6;
      schlunder_C = math.eval('2.5*(1 + (R_p_inner/R_p)^2)',catscope);
      ndim_biot_solid = math.eval('0.48 + 0.192*(R_rctr/cat_effective_radius_volequiv - 1)^2',catscope);
      if (catscope.R_p_inner < catscope.R_p) { //check if inner radius < outer radius for rings
        cat_ext_area = math.eval('2*pi*((R_p + R_p_inner)*L_p + (R_p^2 - R_p_inner^2))',catscope);
        cat_particle_vol = math.eval('pi*(R_p^2 - R_p_inner^2)*L_p',catscope);
      } else if (catscope.R_p_inner >= catscope.R_p){
        // inner radius greater than outer radius doesn't make any sense
        cat_ext_area = 0;
        cat_particle_vol = 0;
      } else {
        //do nothing
      }
    }
          
    catscope.cat_ext_area = cat_ext_area;
    catscope.bed_tortuosity = bed_tortuosity;
    catscope.ndim_peclet_f = ndim_peclet_f;
    catscope.cat_particle_vol = cat_particle_vol;
    catscope.ndim_peclet_r_inf = ndim_peclet_r_inf;
    catscope.schlunder_C = schlunder_C;
    catscope.ndim_biot_solid = ndim_biot_solid;

    //actually write the results to the appropriate fields
    writeOut(cat_ext_area_out,cat_ext_area);
    writeOut(cat_particle_vol_out,cat_particle_vol);
  });
  
  //////////////////////////////////////////////////////////////////////////////  
  // function for three types of effective radii
  $("#R_p,#L_p,#R_p_inner,#cat_ext_area").on('keyup keydown change', function (){
    
    //perform calculations
    var cat_effective_radius = math.eval('sqrt(cat_ext_area/pi)/2',catscope) //applies to all particle shapes
    var cat_effective_radius_ergun = math.eval('3*cat_particle_vol/cat_ext_area',catscope); //applies to all shapes
    var cat_effective_radius_volequiv = math.eval('(3/4/pi*cat_particle_vol)^(1/3)',catscope); //applies to all shapes

    //put result in catscope
    catscope.cat_effective_radius = cat_effective_radius;
    catscope.cat_effective_radius_ergun = cat_effective_radius_ergun;
    catscope.cat_effective_radius_volequiv = cat_effective_radius_volequiv;
  });


  //////////////////////////////////////////////////////////////////////////////  
  // function for particle density
  $("#cat_rho_bulk,#cat_void_frac").on('keyup keydown change', function (){
    //id string of output field
    var cat_rho_particle_out = "#cat_rho_particle";

    //perform calculation
    var cat_rho_particle = math.eval('cat_rho_bulk/(1 - cat_void_frac)',catscope);
    catscope.cat_rho_particle = cat_rho_particle;

    //actually write the results to the appropriate fields
    writeOut(cat_rho_particle_out,cat_rho_particle);//g per cm^3
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for porosity
  $("#cat_rho_particle,#cat_pore_volume,#cat_rho_bulk,#cat_void_frac").on('keyup keydown change', function (){
    //id string of output field
    var cat_porosity_out = "#cat_porosity";

    //perform calculation
    var cat_porosity = math.eval('cat_pore_volume_SI*cat_rho_particle',catscope);
    
    //add result to catscope
    catscope.cat_porosity = cat_porosity;
    
    //actually write the results to the appropriate fields
    writeOut(cat_porosity_out,cat_porosity);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for pore radius
  $("#cat_pore_volume,#cat_surf_area").on('keyup keydown change', function (){
    //id string of output field
    var cat_pore_radius_out = "#cat_pore_radius";

    //perform calculation
    var cat_pore_radius = math.eval('1e10*2*cat_pore_volume/cat_surf_area',catscope)//angstroms
    catscope.cat_pore_radius = cat_pore_radius;
    var cat_pore_radius_SI = math.eval('cat_pore_radius/1e10',catscope)//meters

    //add result to catscope
    catscope.cat_pore_radius_SI = cat_pore_radius_SI;

    //actually write the results to the appropriate fields
    writeOut(cat_pore_radius_out,cat_pore_radius); //angstroms
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for limiting reactant check
  $("#temp,#pressure").on('keyup keydown change', function (){
    if ($('#dr_num_reactants').val() == "Two") {
      //id string of output field
      var limiting_reactant_check_out = "#limiting_reactant_check";

      //perform calculation
      var limiting_reactant_check_LHS = math.eval('molfrac1/molfrac2',catscope);
      var limiting_reactant_check_RHS = math.eval('1/rxn_conversion1',catscope);
      
      //add to catscope
      catscope.limiting_reactant_check_LHS = limiting_reactant_check_LHS;
      catscope.limiting_reactant_check_RHS = limiting_reactant_check_RHS;

      var test_result = ["no","yes"];


      if (catscope.limiting_reactant_check_LHS <= catscope.limiting_reactant_check_RHS) {
        writeOut(limiting_reactant_check_out,test_result[1]);
        $('#limiting_reactant_check').prop("class","clcd-green");
      } else if (catscope.limiting_reactant_check_LHS > catscope.limiting_reactant_check_RHS) {
        writeOut(limiting_reactant_check_out,test_result[0]);
        $('#limiting_reactant_check').prop("class","clcd-red");        
      } else {
        writeOut(limiting_reactant_check_out,'Undefined');
        $('#limiting_reactant_check').prop("class","");
      }

    } else {
      //do nothing
    }
  });

  

  //////////////////////////////////////////////////////////////////////////////  
  // function for mixture thermal conductivity for both gases and liquids
  $("#thermalcond1,#thermalcond2,#molweight1,#molweight2,#molfrac1,#molfrac2").on('keyup keydown change', function (){
    //id string of output field
    var avg_k_conduct_out = "#avg_k_conduct"; //output in kg per m^3

    //intermediate variables
    var kfArray = [catscope.thermalcond1,catscope.thermalcond2,catscope.thermalcond3,catscope.thermalcond4,catscope.thermalcond5];
    
    //add above to catscope
    catscope.kfArray = kfArray;    


    if (catscope.molTest == 1) { //logical test for if mol fractions add to one
        if (catscope.dr_reaction_phase == "Gas Phase") { //GAS phase avg thermal conductivity
          var mwArrayInvThird = math.dotPow(catscope.molWeightArray,1/3) //could convert to math.eval calculation
          var denom = math.multiply(catscope.molFracArray,mwArrayInvThird);
          var numer = math.multiply(math.dotMultiply(catscope.molFracArray,mwArrayInvThird),catscope.kfArray)
          var avg_k_conduct = math.divide(numer,denom);

          //add to catscope
          catscope.avg_k_conduct = avg_k_conduct;

          //actually write the result to the appropriate field
          writeOut(avg_k_conduct_out,avg_k_conduct);
        } else if (catscope.dr_reaction_phase == "Liquid Phase") { //LIQUID phase avg thermal conductivity
          var molar_density_Array = math.eval('liqDensityArray./molWeightArray',catscope); //kmol per m^3 -- units dont matter too much
          molar_density_Array = replaceInfwZero(molar_density_Array);
          catscope.molar_density_Array = molar_density_Array;

          var phiHat_Array_denom = math.eval('sum(molFracArray./molar_density_Array)',catscope);
          catscope.phiHat_Array_denom = phiHat_Array_denom;

          var phiHat_Array = math.eval('(molFracArray./molar_density_Array)/phiHat_Array_denom',catscope); //unitless 'volume fraction'
          catscope.phiHat_Array = phiHat_Array;

          var avg_k_conduct = li_kf_MixingFunction(catscope);
          catscope.avg_k_conduct = avg_k_conduct

          writeOut(avg_k_conduct_out,avg_k_conduct);
        }
    } else {
      writeOut(avg_k_conduct_out,'Sum of Mol Frac. not 1');
    }

  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for mixture viscosity
  $("#fluidvisc1,#fluidvisc2,#molweight1,#molweight2,#molfrac1,#molfrac2").on('keyup keydown change', function (){
    //id string of output field
    var avg_viscosity_out = "#avg_viscosity"; //output in kg per m^3

    //intermediate variables
    var viscArray = [catscope.fluidvisc1,catscope.fluidvisc2,catscope.fluidvisc3,catscope.fluidvisc4,catscope.fluidvisc5];

    //add above to catscope
    catscope.viscArray = viscArray;

    if (catscope.molTest == 1) { //logical test for if mol fractions add to one
        if (catscope.dr_reaction_phase == "Gas Phase") {
          var mwArrayInvHalf = math.dotPow(catscope.molWeightArray,0.5) //could convert to math.eval calculation
          var denom = math.multiply(catscope.molFracArray,mwArrayInvHalf);
          var numer = math.multiply(math.dotMultiply(catscope.molFracArray,mwArrayInvHalf),catscope.viscArray)
          var avg_viscosity = math.divide(numer,denom);

          //add to catscope
          catscope.avg_viscosity = avg_viscosity;

          //actually write the result to the appropriate field
          writeOut(avg_viscosity_out,avg_viscosity);
        } else if (catscope.dr_reaction_phase == "Liquid Phase") { 
          var avg_viscosity = math.eval('sum(molFracArray.*(viscArray.^(1/3)))^3',catscope);

          //add to catscope
          catscope.avg_viscosity = avg_viscosity;

          //actually write the result to the appropriate field
          writeOut(avg_viscosity_out,avg_viscosity);
        }
    } else {
      writeOut(avg_viscosity_out,'Sum of Mol Frac. not 1');
    } 
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for mass of catalyst and bed volume
  $("#cat_rho_bulk,#R_rctr").on('keyup keydown change', function (){
    //id string of output field
    var bed_volume_out = "#bed_volume";
    var mass_catalyst_out = "#mass_catalyst"; //output in kg per m^2 per s

    //perform calculation
    var bed_volume = math.eval('pi*R_rctr^2*L_bed',catscope);
    catscope.bed_volume = bed_volume;

    var mass_catalyst = math.eval('cat_rho_bulk*bed_volume',catscope);
    catscope.mass_catalyst = mass_catalyst;

    //actually write the data to the appropriate cell 
    writeOut(bed_volume_out,bed_volume);
    writeOut(mass_catalyst_out,mass_catalyst);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for feed (mass) flowrate and feed (molar) flowrate of 'A'
  $("#mass_flowrate,#R_rctr,#avg_density").on('keyup keydown change', function (){
    //id string of output field
    var mass_flowrate_out = "#mass_flowrate"; //output in kg per s

    //perform calculation
    var mass_flowrate = math.eval('rxn_rate*mass_catalyst*avg_mw/1000/rxn_conversion1/molfrac1',catscope)
    catscope.mass_flowrate = mass_flowrate;

    var molar_flowrate1 = math.eval('rxn_rate*mass_catalyst/rxn_conversion1',catscope); //molar flowrate of 'A'
    catscope.molar_flowrate1 = molar_flowrate1;

    var volumetric_flowrate = math.eval('mass_flowrate/avg_density',catscope); //units of m^3/s
    catscope.volumetric_flowrate = volumetric_flowrate;

    //actually write the data to the appropriate cell
    writeOut(mass_flowrate_out,mass_flowrate);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for superficial mass flux
  $("#mass_flowrate,#R_rctr").on('keyup keydown change', function (){
    //id string of output field
    var superf_mass_flux_out = "#superf_mass_flux"; //output in kg per m^2 per s

    //perform calculation
    var superf_mass_flux = math.eval('mass_flowrate/(pi*R_rctr^2)',catscope);
    catscope.superf_mass_flux = superf_mass_flux;

    //actually write the data to the appropriate cell
    writeOut(superf_mass_flux_out,superf_mass_flux);  
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Bulk Concentration of Main Reactant 'A'
  $("#molfrac1,#avg_density,#avg_mw").on('keyup keydown change', function (){
    //id string of output field
    var res_bulkconc1_out = "#res_bulkconc1"; //unitless

    //perform calculation
    var avg_mw_SI = math.divide(catscope.avg_mw,1000); //kg per mol
    catscope.avg_mw_SI = avg_mw_SI;

    var res_bulkconc1 = math.eval('molfrac1*avg_density/avg_mw_SI',catscope)//mol per m^3
    catscope.res_bulkconc1 = res_bulkconc1;

    //actually write the data to the appropriate cell
    writeOut(res_bulkconc1_out,res_bulkconc1);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for interfacial area heat and mass transfer
  $("#cat_ext_area,#cat_rho_particle,#cat_particle_vol").on('keyup keydown change', function (){
    //id string of output field
    var cat_interfacial_area_out = "#cat_interfacial_area";

    //perform calculations
    var cat_interfacial_area = math.eval('cat_ext_area/cat_rho_particle/cat_particle_vol',catscope);
    catscope.cat_interfacial_area = cat_interfacial_area;

    //actually write the data to the appropriate cell
    writeOut(cat_interfacial_area_out,cat_interfacial_area);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Prandtl Number
  $("#avg_cp,#avg_viscosity,#avg_k_conduct,#avg_mw").on('keyup keydown change', function (){
    //id string of output field
    var ndim_prandtl_out = "#ndim_prandtl"; //unitless

    //perform calculation
    var ndim_prandtl = math.eval('avg_cp*avg_viscosity/avg_k_conduct',catscope);
    catscope.ndim_prandtl = ndim_prandtl;
    
    //actually write the data to the appropriate cell
    writeOut(ndim_prandtl_out,ndim_prandtl);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Schmidt Number
  $("#avg_density,#avg_viscosity,#diff_mixture").on('keyup keydown change', function (){
    //id string of output field
    var ndim_schmidt_out = "#ndim_schmidt"; //unitless

    //perform calculation
    var ndim_schmidt = math.eval('avg_viscosity/avg_density/diff_mixture',catscope);
    catscope.ndim_schmidt = ndim_schmidt;

    //actually write the data to the appropriate cell
    writeOut(ndim_schmidt_out,ndim_schmidt);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Reynolds Number
  $("#superf_mass_flux,#avg_viscosity,#cat_effective_radius").on('keyup keydown change', function (){
    //id string of output field
    var ndim_reynolds_out = "#ndim_reynolds"; //unitless

    //perform calculation
    var ndim_reynolds = math.eval('2*superf_mass_flux*cat_effective_radius/avg_viscosity',catscope)
    catscope.ndim_reynolds = ndim_reynolds;

    //actually write the data to the appropriate cell
    writeOut(ndim_reynolds_out,ndim_reynolds);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for mass transfer between particles and fluid, k_m, j_D (Chilton-Colburn), and boundary layer thickness
  $("#ndim_reynolds,#superf_mass_flux,#avg_density,#cat_void_frac,#ndim_schmidt").on('keyup keydown change', function (){
    //id string of output field
    var ndim_colburn_out = "#ndim_colburn"; //unitless
    var ndim_massXfer_coeff_out = "#ndim_massXfer_coeff"; //unitless

    //perform calculations

    if (catscope.dr_reaction_phase == "Gas Phase") { //first check gas phase vs. liquid phase
      if (catscope.ndim_reynolds > 1 && catscope.cat_void_frac > 0.25 && catscope.cat_void_frac < 0.95){
        var ndim_colburn = math.eval('(0.765/ndim_reynolds^0.82 + 0.365/ndim_reynolds^0.386)/cat_void_frac',catscope); //correlation from Dwivedi and Upadhyay 1977
        catscope.ndim_colburn = ndim_colburn;
        var ndim_massXfer_coeff = math.eval('ndim_colburn*superf_mass_flux/avg_density/ndim_schmidt^(2/3)',catscope);
        catscope.ndim_massXfer_coeff = ndim_massXfer_coeff;
        $('#ndim_colburn').prop("class","");
        $('#ndim_massXfer_coeff').prop("class","");
        //actually write the data to the appropriate cell
        writeOut(ndim_colburn_out,ndim_colburn);
        writeOut(ndim_massXfer_coeff_out,ndim_massXfer_coeff);
      } else if (catscope.ndim_reynolds < 1) {
        writeOut(ndim_colburn_out,"Reynolds # is too low");
        writeOut(ndim_massXfer_coeff_out,"Error");
        $('#ndim_colburn').prop("class","clcd-red");
        $('#ndim_massXfer_coeff').prop("class","clcd-red");
      }
    } else if (catscope.dr_reaction_phase == "Liquid Phase") {
      if (catscope.ndim_reynolds > 0.01 && catscope.cat_void_frac > 0.25 && catscope.cat_void_frac < 0.95){
        var ndim_colburn = math.eval('(0.765/ndim_reynolds^0.82 + 0.365/ndim_reynolds^0.386)/cat_void_frac',catscope);
        catscope.ndim_colburn = ndim_colburn;
        var ndim_massXfer_coeff = math.eval('ndim_colburn*superf_mass_flux/avg_density/ndim_schmidt^(2/3)',catscope);
        catscope.ndim_massXfer_coeff = ndim_massXfer_coeff;
        $('#ndim_colburn').prop("class","");
        $('#ndim_massXfer_coeff').prop("class","");
        //actually write the data to the appropriate cell
        writeOut(ndim_colburn_out,ndim_colburn);
        writeOut(ndim_massXfer_coeff_out,ndim_massXfer_coeff);
      } else if (catscope.ndim_reynolds < 0.01) {
        writeOut(ndim_colburn_out,"Reynolds # is too low");
        writeOut(ndim_massXfer_coeff_out,"Error");
        $('#ndim_colburn').prop("class","clcd-red");
        $('#ndim_massXfer_coeff').prop("class","clcd-red");
      }
    }



    var ndim_BL_thickness = math.eval('diff_mixture/ndim_massXfer_coeff/cat_effective_radius',catscope);
    catscope.ndim_BL_thickness = ndim_BL_thickness;
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Sherwood Number
  $("#ndim_massXfer_coeff,#cat_effective_radius,#diff_mixture").on('keyup keydown change', function (){
    //id string of output field
    var ndim_sherwood_out = "#ndim_sherwood"; //unitless

    //perform calculations
    var ndim_sherwood = math.eval('2*ndim_massXfer_coeff*cat_effective_radius/diff_mixture',catscope);
    catscope.ndim_sherwood = ndim_sherwood;
    
    //actually write the data to the appropriate cell
    writeOut(ndim_sherwood_out,ndim_sherwood);
  });


  //////////////////////////////////////////////////////////////////////////////  
  // function for particle-fluid heat transfer coefficient (Chilton-Colburn analogy)
  $("#ndim_colburn,#avg_cp,#superf_mass_flux,#ndim_prandtl").on('keyup keydown change', function (){
    //id string of output field
    var ndim_heatXfer_coeff_out = "#ndim_heatXfer_coeff";

    //perform calculations
    var ndim_heatXfer_coeff = math.eval('ndim_colburn*avg_cp*superf_mass_flux/(ndim_prandtl^(2/3))',catscope);
    catscope.ndim_heatXfer_coeff = ndim_heatXfer_coeff;

    //actually write the data to the appropriate cell
    writeOut(ndim_heatXfer_coeff_out,ndim_heatXfer_coeff);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Nusselt number
  $("#ndim_heatXfer_coeff,#cat_effective_radius,#avg_k_conduct").on('keyup keydown change', function (){
    //id string of output field
    var ndim_nusselt_out = "#ndim_nusselt";

    //perform calculations
    var ndim_nusselt = math.eval('2*ndim_heatXfer_coeff*cat_effective_radius/avg_k_conduct',catscope);
    catscope.ndim_nusselt = ndim_nusselt;

    //actually write the data to the appropriate cell
    writeOut(ndim_nusselt_out,ndim_nusselt);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for maximum possible fully diffusion limited rate
  $("#ndim_massXfer_coeff,#cat_interfacial_area,#res_bulkconc1,#ndim_reynolds").on('keyup keydown change', function (){
    //id string of output field
    var rxn_maxlimitingrate_out = "#rxn_maxlimitingrate"; //unitless

    //perform calculations
    var rxn_maxlimitingrate = math.eval('ndim_massXfer_coeff*cat_interfacial_area*res_bulkconc1',catscope);
    catscope.rxn_maxlimitingrate = rxn_maxlimitingrate;

    //actually write the data to the appropriate cell
    writeOut(rxn_maxlimitingrate_out,rxn_maxlimitingrate);
  });


  //////////////////////////////////////////////////////////////////////////////  
  // function for mixture heat capacity
  $("#heatcapacity1,#heatcapacity2,#molfrac1,#molfrac2").on('keyup keydown change', function (){
    //id string of output field
    var avg_cp_out = "#avg_cp"; //output in J per kg per K

    //intermediate variables
    var cpArray = [catscope.heatcapacity1,catscope.heatcapacity2,catscope.heatcapacity3,catscope.heatcapacity4,catscope.heatcapacity5];
    catscope.cpArray = cpArray;

    if (catscope.molTest == 1) { //logical test for if mol fractions add to one
      var denom = math.eval('sum(molFracArray*transpose(molWeightArray))',catscope);
      var numerator = math.sum(math.dotMultiply(math.dotMultiply(catscope.molFracArray,catscope.molWeightArray),catscope.cpArray));
      var avg_cp = math.divide(numerator,denom);
      catscope.avg_cp = avg_cp;
      //actually write the result to the appropriate field
      writeOut(avg_cp_out,avg_cp);
    } else {
      writeOut(avg_cp_out,'Sum of Mol Frac. not 1');
    }  
  });


  //////////////////////////////////////////////////////////////////////////////  
  // function for Knudsen Diffusivity
  $("#cat_pore_radius,#avg_mw,#rxn_surftemperature,#rxn_surfconcentration").on('keyup keydown change', function (){
    //id string of output field
    var diff_knudsen_out = "#diff_knudsen"; //unitless

    var cat_pore_radius_cm = math.divide(catscope.cat_pore_radius,1e8);
    catscope.cat_pore_radius_cm = cat_pore_radius_cm;

    var max_mw = math.max(catscope.molWeightArray);
    catscope.max_mw = max_mw;

    catscope.itercount = math.sum(catscope.itercount,1);

    //perform calculations
    var diff_knudsen = math.eval('9700*cat_pore_radius_cm*(rxn_surftemperature/max_mw)^0.5/1e4',catscope); //m^2 per s
    catscope.diff_knudsen = diff_knudsen;
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Effective Diffusivity -- separate for liquids vs. gases
  $("#cat_pore_tortuosity,#diff_mixture,#diff_knudsen,#temp,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field
    var diff_effective_out = "#diff_effective"; //unitless

    //perform calculations
    if (catscope.ck_override_diffusivity == true) { //check if the user has asked to override the effective diffusivity
      var diff_effective = catscope.diff_effective_override
      catscope.diff_effective = diff_effective;
    } else {
      if (catscope.dr_reaction_phase == "Gas Phase") {
        var diff_effective = math.eval('cat_porosity/cat_pore_tortuosity/((1/diff_mixture)*(temp/rxn_surftemperature)^1.75 + (1/diff_knudsen))',catscope);
        catscope.diff_effective = diff_effective;
      } else if (catscope.dr_reaction_phase == "Liquid Phase") { 
        var diff_effective = math.eval('cat_porosity/cat_pore_tortuosity*pore_constriction_factor*diff_mixture*exp(-1608*(1/temp - 1/rxn_surftemperature))',catscope);
        catscope.diff_effective = diff_effective;
      }
    }
    //actually write the data to the appropriate cell
    writeOut(diff_effective_out,diff_effective);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for observed rate constant, inlet and outlet rates, and surface concentrations at the average, inlet and outlet
  $("#cat_pore_tortuosity,#diff_mixture,#diff_knudsen,#temp,#rxn_surfconcentration,#rxn_surftemperature,#rxn_externalconc_grad").on('keyup keydown change', function (){
    
    var rxn_externalconc_grad_out = "#rxn_externalconc_grad";


    if (catscope.dr_rxn_order == 0) { //look at the user reported reaction order to decide what equation to use
      var rxn_observed_rconst = math.eval('rxn_rate',catscope); //for zero order reactions k = r_obs with units of mol/kg-cat/s
      catscope.rxn_observed_rconst = rxn_observed_rconst;

      var rxn_avg_bulk_concentration1 = math.eval('res_bulkconc1*(1 - 0.5*rxn_conversion1)',catscope); //average occurs at 1/2*X due to linear concentration gradient
      catscope.rxn_avg_bulk_concentration1 = rxn_avg_bulk_concentration1;

      catscope.rxn_rate_inlet = catscope.rxn_observed_rconst;
      catscope.rxn_rate_outlet = catscope.rxn_observed_rconst;

      var rxn_bulkconc_outlet1 = math.eval('res_bulkconc1*(1-rxn_conversion1)',catscope);
      catscope.rxn_bulkconc_outlet1 = rxn_bulkconc_outlet1;

      var rxn_surfconcentration_inlet = math.eval('res_bulkconc1 - rxn_observed_rconst/ndim_massXfer_coeff/cat_interfacial_area',catscope);
      catscope.rxn_surfconcentration_inlet = rxn_surfconcentration_inlet;  

      var rxn_surfconcentration_outlet = math.eval('res_bulkconc1*(1 - rxn_observed_rconst/volumetric_flowrate/res_bulkconc1*mass_catalyst) - rxn_observed_rconst/ndim_massXfer_coeff/cat_interfacial_area',catscope);
      catscope.rxn_surfconcentration_outlet = rxn_surfconcentration_outlet;  

      //////////////////////
      var rxn_surfconcentration = math.eval('rxn_avg_bulk_concentration1 - (rxn_rate/ndim_massXfer_coeff/cat_interfacial_area)',catscope); //res_bulkconc1 is incorrect
      catscope.rxn_surfconcentration = rxn_surfconcentration;

    } else if (catscope.dr_rxn_order == 1) { 
      //perform calculations
      var rxn_observed_rconst = math.eval('-volumetric_flowrate/mass_catalyst*(log(1-rxn_rate*mass_catalyst/res_bulkconc1/volumetric_flowrate))',catscope);
      catscope.rxn_observed_rconst = rxn_observed_rconst;

      var rxn_avg_bulk_concentration1 = math.eval('res_bulkconc1*volumetric_flowrate/rxn_observed_rconst/mass_catalyst*(1-exp(-rxn_observed_rconst/volumetric_flowrate*mass_catalyst))',catscope); 
      catscope.rxn_avg_bulk_concentration1 = rxn_avg_bulk_concentration1;

      var rxn_rate_inlet = math.eval('rxn_observed_rconst*res_bulkconc1',catscope); //rate of reaction @ inlet in units of mol/kgcat/s
      catscope.rxn_rate_inlet = rxn_rate_inlet;

      var rxn_rate_outlet = math.eval('rxn_observed_rconst*res_bulkconc1*(1/exp(rxn_observed_rconst/volumetric_flowrate*mass_catalyst))',catscope);//rate of reaction @ outlet in units of mol/kgcat/s
      catscope.rxn_rate_outlet = rxn_rate_outlet;  

      var rxn_bulkconc_outlet1 = math.eval('res_bulkconc1*(1-rxn_conversion1)',catscope);
      catscope.rxn_bulkconc_outlet1 = rxn_bulkconc_outlet1;

      var rxn_surfconcentration_inlet = math.eval('res_bulkconc1 - rxn_observed_rconst*res_bulkconc1/ndim_massXfer_coeff/cat_interfacial_area',catscope);
      catscope.rxn_surfconcentration_inlet = rxn_surfconcentration_inlet;  

      var rxn_surfconcentration_outlet = math.eval('res_bulkconc1*(1/exp(rxn_observed_rconst/volumetric_flowrate*mass_catalyst)) - rxn_observed_rconst*res_bulkconc1/ndim_massXfer_coeff/cat_interfacial_area*(1/exp(rxn_observed_rconst/volumetric_flowrate*mass_catalyst))',catscope);
      catscope.rxn_surfconcentration_outlet = rxn_surfconcentration_outlet;  

      //////////////////////
      var rxn_surfconcentration = math.eval('rxn_avg_bulk_concentration1 - (rxn_rate/ndim_massXfer_coeff/cat_interfacial_area)',catscope);
      catscope.rxn_surfconcentration = rxn_surfconcentration;

    } else if (catscope.dr_rxn_order == 2) {
      //perform calculations
      var rxn_observed_rconst = math.eval('rxn_rate/res_bulkconc1^2/(1-rxn_conversion1)',catscope);
      catscope.rxn_observed_rconst = rxn_observed_rconst;

      var rxn_avg_bulk_concentration1 = math.eval('volumetric_flowrate/(rxn_observed_rconst*mass_catalyst)*log(rxn_observed_rconst*res_bulkconc1/volumetric_flowrate*mass_catalyst + 1)',catscope); //2nd Order
      catscope.rxn_avg_bulk_concentration1 = rxn_avg_bulk_concentration1;

      var rxn_rate_inlet = math.eval('rxn_observed_rconst*res_bulkconc1^2',catscope); //rate of reaction @ inlet in units of mol/kgcat/s
      catscope.rxn_rate_inlet = rxn_rate_inlet;

      var rxn_rate_outlet = math.eval('rxn_observed_rconst*res_bulkconc1^2*(1 - rxn_conversion1)^2',catscope);//rate of reaction @ outlet in units of mol/kgcat/s
      catscope.rxn_rate_outlet = rxn_rate_outlet;  

      var rxn_bulkconc_outlet1 = math.eval('res_bulkconc1*(1 - rxn_conversion1)',catscope);
      catscope.rxn_bulkconc_outlet1 = rxn_bulkconc_outlet1;

      var rxn_surfconcentration_inlet = math.eval('res_bulkconc1 - rxn_observed_rconst*res_bulkconc1^2/ndim_massXfer_coeff/cat_interfacial_area',catscope);
      catscope.rxn_surfconcentration_inlet = rxn_surfconcentration_inlet;  

      var rxn_surfconcentration_outlet = math.eval('res_bulkconc1/(rxn_observed_rconst*res_bulkconc1/volumetric_flowrate*mass_catalyst + 1) - rxn_observed_rconst*res_bulkconc1^2/ndim_massXfer_coeff/cat_interfacial_area*(1/(rxn_observed_rconst*res_bulkconc1/volumetric_flowrate*mass_catalyst + 1))^2',catscope);
      catscope.rxn_surfconcentration_outlet = rxn_surfconcentration_outlet;  

      //////////////////////
      var rxn_surfconcentration = math.eval('rxn_avg_bulk_concentration1 - (rxn_rate/ndim_massXfer_coeff/cat_interfacial_area)',catscope);
      catscope.rxn_surfconcentration = rxn_surfconcentration;

    }

    var rxn_externalconc_grad = math.eval('(rxn_avg_bulk_concentration1 - rxn_surfconcentration)*100/rxn_avg_bulk_concentration1',catscope);
    catscope.rxn_externalconc_grad = rxn_externalconc_grad;

    writeOut(rxn_externalconc_grad_out,rxn_externalconc_grad);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for external temperature gradient
  $("#ndim_massXfer_coeff,#ndim_heatXfer_coeff,#rxn_surfconcentration,#rxn_rate,#temp").on('keyup keydown change', function (){
    //id string of output field
    var rxn_externaltemp_grad_out = "#rxn_externaltemp_grad"; 

    //perform calculations    
    var rxn_surftemperature = math.eval('-rxn_enthalpy*ndim_massXfer_coeff/ndim_heatXfer_coeff*(rxn_avg_bulk_concentration1 - rxn_surfconcentration) + temp',catscope);
    catscope.rxn_surftemperature = rxn_surftemperature; 

    var rxn_externaltemp_grad = math.eval('rxn_surftemperature - temp',catscope);
    catscope.rxn_externaltemp_grad = rxn_externaltemp_grad;

    //actually write the data to the appropriate cell
    writeOut(rxn_externaltemp_grad_out,rxn_externaltemp_grad);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Weisz-Prater Modulus, Thiele Modulus, and Effectiveness Factor @ inlet, outlet and average
  $("#rxn_surfconcentration,#rxn_surftemperature,#temp,#diff_knudsen,#cat_pore_tortuosity,#pressure").on('keyup keydown change', function (){
    //id string of output field
    var rxn_weisz_prater_out = "#rxn_weisz_prater"; //unitless
    var rxn_weisz_prater_inlet_out = "#rxn_weisz_prater_inlet"; //unitless
    var rxn_weisz_prater_outlet_out = "#rxn_weisz_prater_outlet"; //unitless

    var rxn_thiele_out = "#rxn_thiele"; //unitless
    var rxn_thiele_inlet_out = "#rxn_thiele_inlet"; //unitless
    var rxn_thiele_outlet_out = "#rxn_thiele_outlet"; //unitless
    
    var rxn_eff_factor_out = "#rxn_eff_factor"; //unitless
    var rxn_eff_factor_inlet_out = "#rxn_eff_factor_inlet"; //unitless
    var rxn_eff_factor_outlet_out = "#rxn_eff_factor_outlet"; //unitless

    //perform calculations
    var aris_L = math.eval('cat_particle_vol/cat_ext_area',catscope); //only applies to catalyts with complete active material depth
    catscope.aris_L = aris_L;

    var rxn_weisz_prater = math.eval('rxn_rate*cat_rho_particle*aris_L^2/rxn_surfconcentration/diff_effective',catscope);
    var rxn_weisz_prater_inlet = math.eval('rxn_rate_inlet*cat_rho_particle*aris_L^2/rxn_surfconcentration_inlet/diff_effective',catscope);
    var rxn_weisz_prater_outlet = math.eval('rxn_rate_outlet*cat_rho_particle*aris_L^2/rxn_surfconcentration_outlet/diff_effective',catscope);
    catscope.rxn_weisz_prater = rxn_weisz_prater;
    catscope.rxn_weisz_prater_inlet = rxn_weisz_prater_inlet;
    catscope.rxn_weisz_prater_outlet = rxn_weisz_prater_outlet;

    if (catscope.rxn_weisz_prater < 1) {
      var rxn_thiele = math.eval('rxn_weisz_prater^0.575*(0.334*rxn_weisz_prater^0.972 + (1/rxn_weisz_prater)^0.075)',catscope); //has maximum error of 0.23% at M_WP = 0.999
      var rxn_thiele_inlet = math.eval('rxn_weisz_prater_inlet^0.575*(0.334*rxn_weisz_prater_inlet^0.972 + (1/rxn_weisz_prater_inlet)^0.075)',catscope); 
      var rxn_thiele_outlet = math.eval('rxn_weisz_prater_outlet^0.575*(0.334*rxn_weisz_prater_outlet^0.972 + (1/rxn_weisz_prater_outlet)^0.075)',catscope); 
      catscope.rxn_thiele = rxn_thiele;
      catscope.rxn_thiele_inlet = rxn_thiele_inlet;
      catscope.rxn_thiele_outlet = rxn_thiele_outlet;
    } else if (catscope.rxn_weisz_prater >= 1) {
      var rxn_thiele = math.eval('rxn_weisz_prater + (1/3)',catscope); //error is lower than above across range that it is applied
      var rxn_thiele_inlet = math.eval('rxn_weisz_prater_inlet + (1/3)',catscope);
      var rxn_thiele_outlet = math.eval('rxn_weisz_prater_outlet + (1/3)',catscope);
      catscope.rxn_thiele = rxn_thiele;
      catscope.rxn_thiele_inlet = rxn_thiele_inlet;
      catscope.rxn_thiele_outlet = rxn_thiele_outlet;
    } else {
      //do nothing
    }    

    var rxn_eff_factor = math.eval('rxn_weisz_prater/rxn_thiele^2',catscope);
    var rxn_eff_factor_inlet = math.eval('rxn_weisz_prater_inlet/rxn_thiele_inlet^2',catscope);
    var rxn_eff_factor_outlet = math.eval('rxn_weisz_prater_outlet/rxn_thiele_outlet^2',catscope);
    catscope.rxn_eff_factor = rxn_eff_factor;
    catscope.rxn_eff_factor_inlet = rxn_eff_factor_inlet;
    catscope.rxn_eff_factor_outlet = rxn_eff_factor_outlet;

    //actually write the data to the appropriate cell
    writeOut(rxn_weisz_prater_out,rxn_weisz_prater);
    writeOut(rxn_weisz_prater_inlet_out,rxn_weisz_prater_inlet);
    writeOut(rxn_weisz_prater_outlet_out,rxn_weisz_prater_outlet);

    writeOut(rxn_thiele_out,rxn_thiele);
    writeOut(rxn_thiele_inlet_out,rxn_thiele_inlet);
    writeOut(rxn_thiele_outlet_out,rxn_thiele_outlet);

    writeOut(rxn_eff_factor_out,rxn_eff_factor);
    writeOut(rxn_eff_factor_inlet_out,rxn_eff_factor_inlet);
    writeOut(rxn_eff_factor_outlet_out,rxn_eff_factor_outlet);
  });


  //////////////////////////////////////////////////////////////////////////////  
  // function for Prater Number or thermicity
  $("#rxn_enthalpy,#diff_effective,#rxn_surfconcentration,#cat_thermal_cond,#rxn_surftemperature").on('keyup keydown change', function (){ 
    //id string of output field
    var ndim_prater_out = "#ndim_prater"; //unitless

    //perform calculations
    var ndim_prater = math.eval('-rxn_enthalpy*diff_effective*rxn_surfconcentration/cat_thermal_cond/rxn_surftemperature',catscope);
    catscope.ndim_prater = ndim_prater;

    //actually write the data to the appropriate cell
    writeOut(ndim_prater_out,ndim_prater);
  });


  //////////////////////////////////////////////////////////////////////////////  
  // function for Internal Temperature Gradient
  $("#rxn_enthalpy,#diff_effective,#rxn_surfconcentration,#cat_thermal_cond,#rxn_thiele,#temp,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field
    var rxn_internaltemp_grad_out = "#rxn_internaltemp_grad"; //unitless

    //perform calculations
    var rxn_internaltemp_grad = math.eval('-rxn_enthalpy*diff_effective/cat_thermal_cond*(rxn_surfconcentration - (rxn_surfconcentration/cosh(rxn_thiele)))',catscope);
    catscope.rxn_internaltemp_grad = rxn_internaltemp_grad;

    //actually write the data to the appropriate cell
    writeOut(rxn_internaltemp_grad_out,rxn_internaltemp_grad);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Intrinsic first-order rate constant
  $("#rxn_rate,#rxn_eff_factor,#rxn_surfconcentration,#rxn_surftemperature,#rxn_internaltemp_grad").on('keyup keydown change', function (){
    //id string of output field
    var rxn_intrinsic_rconst_out = "#rxn_intrinsic_rconst"; //unitless

    //perform calculations
    var rxn_intrinsic_rconst = math.eval('rxn_rate/rxn_eff_factor/rxn_surfconcentration',catscope);
    catscope.rxn_intrinsic_rconst = rxn_intrinsic_rconst;

    //actually write the data to the appropriate cell
    writeOut(rxn_intrinsic_rconst_out,rxn_intrinsic_rconst);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for calculating axial dispersion coeff, Peclet number, and Bodenstein number
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration").on('keyup keydown change', function (){
    //id string of output field
    var axial_disp_coeff_out = "#axial_disp_coeff";
    var ndim_peclet_out = "#ndim_peclet";
    var ndim_bodenstein_out = "#ndim_bodenstein";

    //perform calculations and logical tests

    if (catscope.dr_reaction_phase == "Gas Phase") { //first check if the phase is gas phase for axial disp coefficients
      if (catscope.ndim_reynolds > 1) {
        var axial_disp_coeff = math.eval('cat_effective_radius_ergun*superf_mass_flux/avg_density',catscope);
      } else if (catscope.ndim_reynolds <= 1){
        var axial_disp_coeff = math.eval('diff_mixture*cat_void_frac/bed_tortuosity',catscope); //bed_tortuosity is selected earlier based on dr_cat_shape
      } else {
        var axial_disp_coeff = 0;
      }
    } else if (catscope.dr_reaction_phase == "Liquid Phase") {//next check if the phase is liquid phase for axial disp coefficients
      if (catscope.ndim_reynolds < 0.0001) {
        var axial_disp_coeff = math.eval('diff_mixture*cat_void_frac/bed_tortuosity',catscope);
      } else if (catscope.ndim_reynolds < 1000 && catscope.ndim_reynolds >= 0.0001) {
        var axial_disp_coeff = math.eval('4*cat_effective_radius_ergun*superf_mass_flux/avg_density',catscope);
      } else if (catscope.ndim_reynolds >= 1000){
        var axial_disp_coeff = math.eval('cat_effective_radius_ergun*superf_mass_flux/avg_density',catscope);
      } else {
        var axial_disp_coeff = 0;
      }
    }
    
    catscope.axial_disp_coeff = axial_disp_coeff;

    var ndim_peclet = math.eval('L_bed*superf_mass_flux/cat_void_frac/avg_density/axial_disp_coeff',catscope);
    catscope.ndim_peclet = ndim_peclet;

    var ndim_bodenstein = math.eval('2*cat_effective_radius_ergun*superf_mass_flux/avg_density/axial_disp_coeff',catscope); //possibly wrong but not used for anything
    catscope.ndim_bodenstein = ndim_bodenstein;
    
    //write values to appropriate cells
    writeOut(axial_disp_coeff_out,axial_disp_coeff);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for calculating radial dispersion coeff, and equations from Sie et. al.
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field
    var radial_disp_coeff_out = "#radial_disp_coeff";

    //perform calculations and logical tests
    var radial_disp_coeff = math.eval('2*cat_effective_radius_ergun*superf_mass_flux/cat_void_frac/avg_density*((1/ndim_peclet_f) + cat_void_frac/bed_tortuosity/ndim_reynolds/ndim_schmidt)',catscope);
    catscope.radial_disp_coeff = radial_disp_coeff;

    var sie_kappa = math.eval('0.07*(10^(-R_rctr/20/cat_effective_radius_ergun))',catscope)
    catscope.sie_kappa = sie_kappa;
    
    //write values to appropriate cells
    writeOut(radial_disp_coeff_out,radial_disp_coeff);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for Mears radial interparticle heat transport calculations
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration").on('keyup keydown change', function (){
    //id string of output field
    var schlunder_thermal_cond_out = "#schlunder_thermal_cond";

    //perform calculations and logical tests

    var schlunder_B = math.eval('schlunder_C*((1-cat_void_frac)/cat_void_frac)^(10/9)',catscope);
    catscope.schlunder_B = schlunder_B;
    
    var schlunder_thermal_cond_static = math.eval('avg_k_conduct*(1 - sqrt(1-cat_void_frac) + 2*sqrt(1-cat_void_frac)/(1-avg_k_conduct*schlunder_B/cat_thermal_cond)*((1-avg_k_conduct/cat_thermal_cond)*schlunder_B/(1-avg_k_conduct*schlunder_B/cat_thermal_cond)^2*log(cat_thermal_cond/schlunder_B/avg_k_conduct) - (schlunder_B + 1)/2 - (schlunder_B - 1)/(1-avg_k_conduct*schlunder_B/cat_thermal_cond)))',catscope);
    catscope.schlunder_thermal_cond_static = schlunder_thermal_cond_static;

    var bed_thermal_cond_dynamic = math.eval('avg_k_conduct*ndim_reynolds*ndim_prandtl/ndim_peclet_r_inf',catscope);
    catscope.bed_thermal_cond_dynamic = bed_thermal_cond_dynamic;

    var schlunder_thermal_cond = math.eval('schlunder_thermal_cond_static + bed_thermal_cond_dynamic',catscope);
    catscope.schlunder_thermal_cond = schlunder_thermal_cond;
   
    //write values to appropriate cells
    writeOut(schlunder_thermal_cond_out,schlunder_thermal_cond);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for calculating pressure drop via Ergun equation
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration").on('keyup keydown change', function (){
    //id string of output field
    var bed_pressure_drop_out = "#bed_pressure_drop";

    //perform calculations and logical tests
    var ndim_reynolds_ergunR = math.eval('2*superf_mass_flux*cat_effective_radius_ergun/avg_viscosity',catscope);
    catscope.ndim_reynolds_ergunR = ndim_reynolds_ergunR;

    var bed_pressure_drop_SI = math.eval('L_bed*(superf_mass_flux^2*(1 - cat_void_frac)/avg_density/2/cat_effective_radius_ergun/cat_void_frac^3*(150*(1 - cat_void_frac)/ndim_reynolds_ergunR + 1.75))',catscope); //ergun parameters are hardcoded to 150 and 1.75
    catscope.bed_pressure_drop_SI = bed_pressure_drop_SI; //Pascals
   
    var bed_pressure_drop = math.eval('bed_pressure_drop_SI/1e5',catscope);
    catscope.bed_pressure_drop = bed_pressure_drop; //bar

    //write values to appropriate cells
    writeOut(bed_pressure_drop_out,bed_pressure_drop);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for calculating space time and superficial velocity
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration").on('keyup keydown change', function (){
    //id string of output field
    //var superf_velocity_out = "#superf_velocity";
    var bed_space_time_out = "#bed_space_time";

    //perform calculations and logical tests
    var bed_space_time = math.eval('bed_volume/mass_flowrate*avg_density',catscope);
    catscope.bed_space_time = bed_space_time;

    //write values to appropriate cells
    writeOut(bed_space_time_out,bed_space_time);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for calculating solid conductivity
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field

    //perform calculations and logical tests
    var dixon_kappa = math.eval('cat_thermal_cond/avg_k_conduct',catscope);
    catscope.dixon_kappa = dixon_kappa;

    var dixon_phi1 = math.eval('0.333*(1-1/dixon_kappa)^2/(log(dixon_kappa - 0.577*(dixon_kappa-1)) - 0.423*(1-1/dixon_kappa)) - 2/3/dixon_kappa',catscope);
    catscope.dixon_phi1 = dixon_phi1;

    var dixon_phi2 = math.eval('0.072*(1 - 1/dixon_kappa)^2/(log(dixon_kappa - 0.925*(dixon_kappa-1)) - 0.075*(1-1/dixon_kappa)) - 2/3/dixon_kappa',catscope);
    catscope.dixon_phi2 = dixon_phi2;

    var dixon_lv_dp = math.eval('dixon_phi2 + (dixon_phi1 - dixon_phi2)*(cat_void_frac - 0.26)/(0.476 - 0.26)',catscope);
    catscope.dixon_lv_dp = dixon_lv_dp;

    var dixon_krs = math.eval('avg_k_conduct*(cat_void_frac + (1 - cat_void_frac)/(dixon_lv_dp + 2/3/dixon_kappa))',catscope);
    catscope.dixon_krs = dixon_krs; //currently UNUSED -- using other correlation instead

    //write values to appropriate cells
    //nothing to output here
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for calculating overall "h" for reactor
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field
    var dixon_h_wall_out = "#dixon_h_wall";
    var dixon_h_overall_out = "#dixon_h_overall";

    //perform calculations and logical tests
    var ndim_peclet_rf = math.eval('1/(cat_void_frac*bed_tortuosity/ndim_reynolds/ndim_prandtl + 1/ndim_peclet_r_inf)',catscope); 
    catscope.ndim_peclet_rf = ndim_peclet_rf;

    var ndim_nusselt_fluidsolid = math.eval('0.255/cat_void_frac*ndim_prandtl^0.33*ndim_reynolds^0.67',catscope);
    catscope.ndim_nusselt_fluidsolid = ndim_nusselt_fluidsolid;

    var dixon_n_solid = math.eval('1.5*(1 - cat_void_frac)*(R_rctr/cat_effective_radius_ergun)^2/(schlunder_thermal_cond_static/avg_k_conduct*(1/ndim_nusselt_fluidsolid + 0.1*avg_k_conduct/cat_thermal_cond))',catscope); // using cat_effective_radius_ergun as recommended by Landon, Hebert, Adams AIChE Symposium Series, Vol 92, 1996, pg 134
    catscope.dixon_n_solid = dixon_n_solid;

    var dixon_n_fluid = math.eval('1.5*(1 - cat_void_frac)*(R_rctr/cat_effective_radius_ergun)^2/(ndim_reynolds*ndim_prandtl/ndim_peclet_rf*(1/ndim_nusselt_fluidsolid + 0.1*avg_k_conduct/cat_thermal_cond))',catscope);
    catscope.dixon_n_fluid = dixon_n_fluid;

    var ndim_nusselt_wallfluid = math.eval('0.523*(1 - cat_effective_radius_volequiv/R_rctr)*ndim_prandtl^0.33*ndim_reynolds^0.738',catscope);
    catscope.ndim_nusselt_wallfluid = ndim_nusselt_wallfluid;

    var dixon_beta_solid = math.eval('schlunder_thermal_cond_static/avg_k_conduct/(8/dixon_n_solid + (ndim_biot_solid + 4)/ndim_biot_solid)',catscope);
    catscope.dixon_beta_solid = dixon_beta_solid;

    var ndim_biot_fluid = math.eval('ndim_nusselt_wallfluid*R_rctr*ndim_peclet_rf/2/cat_effective_radius_volequiv/ndim_reynolds/ndim_prandtl',catscope);
    catscope.ndim_biot_fluid = ndim_biot_fluid;
    
    var dixon_beta_fluid = math.eval('ndim_reynolds*ndim_prandtl/ndim_peclet_rf/(8/dixon_n_fluid + (ndim_biot_fluid + 4)/ndim_biot_fluid)',catscope);
    catscope.dixon_beta_fluid = dixon_beta_fluid;

    if (catscope.ndim_reynolds >= 100) {
      var dixon_h_wall = math.eval('avg_k_conduct/2/cat_effective_radius_ergun*(8*dixon_beta_solid*cat_effective_radius_ergun/R_rctr + ndim_nusselt_wallfluid*(1 + dixon_beta_solid*ndim_peclet_rf/ndim_reynolds/ndim_prandtl))',catscope); 
      catscope.dixon_h_wall = dixon_h_wall;
    } else if (catscope.ndim_reynolds < 100) {
      var dixon_h_wall = math.eval('avg_k_conduct/2/cat_effective_radius_ergun*(8*dixon_beta_fluid*cat_effective_radius_ergun/R_rctr + 2*ndim_biot_solid*schlunder_thermal_cond_static*cat_effective_radius_ergun/avg_k_conduct/R_rctr*(1 + dixon_beta_fluid*avg_k_conduct/schlunder_thermal_cond_static))',catscope); 
      catscope.dixon_h_wall = dixon_h_wall;
    } else {
      //do nothing
    }

    var dixon_h_overall = math.eval('1/(1/dixon_h_wall + R_rctr/4/schlunder_thermal_cond)',catscope); //W per m^2 per K
    catscope.dixon_h_overall = dixon_h_overall;

    //write values to appropriate cells
    writeOut(dixon_h_overall_out,dixon_h_overall);
    writeOut(dixon_h_wall_out,dixon_h_wall);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for calculating reactor hotspot magnitude
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field
    var bed_axial_max_deltatemp_out = "#bed_axial_max_deltatemp";

    //perform calculations and logical tests
    var bed_axial_max_deltatemp_shapefactor = 1; //fixed at 1
    catscope.bed_axial_max_deltatemp_shapefactor = bed_axial_max_deltatemp_shapefactor;

    var bed_axial_max_deltatemp = math.eval('-bed_axial_max_deltatemp_shapefactor*molar_flowrate1*rxn_enthalpy*rxn_conversion1/pi/dixon_h_overall/R_rctr/L_bed',catscope);  
    catscope.bed_axial_max_deltatemp = bed_axial_max_deltatemp;

    //write values to appropriate cells
    writeOut(bed_axial_max_deltatemp_out,bed_axial_max_deltatemp);
  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for particle-scale validation tests
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field
    var test_realrate_out = "#test_realrate"; //
    var test_molfrac_out = "#test_molfrac"; //
    var test_voidfrac_out = "#test_voidfrac"; //
    var test_kp_out = "#test_kp"; //
    var test_porosity_out = "#test_porosity"; //
    var test_tortuosity_out = "#test_tortuosity"; //
    var test_ndim_prandtl_out = "#test_ndim_prandtl"; //
    var test_ndim_reynolds_out = "#test_ndim_reynolds"; //
    var test_ndim_prater_out = "#test_ndim_prater"; //
    var test_externalconc_limit_out = "#test_externalconc_limit"; //
    var test_externalconc_control_out = "#test_externalconc_control"; //
    var test_externaltemp_out = "#test_externaltemp"; //
    var test_internaltemp_out = "#test_internaltemp"; //
    var test_internalconc_limit_out = "#test_internalconc_limit"; //
    var test_internalconc_strong_out = "#test_internalconc_strong"; //

    //yes-no array
    var test_result = ["no","yes"];
    var test_result_alt = ["no","yes!"];
    

    //next comes the logical tests used in the sheet
    if (catscope.rxn_rate < catscope.rxn_maxlimitingrate) { 
      writeOut(test_realrate_out,test_result[1]);
      $('#test_realrate').prop("class","clcd-green");
    } else if (catscope.rxn_rate >= catscope.rxn_maxlimitingrate) {
      //actually write the result to the appropriate field
      writeOut(test_realrate_out,test_result[0]);
      $('#test_realrate').prop("class","clcd-red");
    } else {
      writeOut(test_realrate_out,'Undefined');
      $('#test_realrate').prop("class","");
    }

    if (catscope.molTest == 1) { 
      writeOut(test_molfrac_out,test_result[1]);
      $('#test_molfrac').prop("class","clcd-green");
    } else if (catscope.molTest == 0) {
      //actually write the result to the appropriate field
      writeOut(test_molfrac_out,test_result[0]);
      $('#test_molfrac').prop("class","clcd-red");
    } else {
      writeOut(test_molfrac_out,'Undefined');
      $('#test_molfrac').prop("class","");
    }


    if (catscope.cat_void_frac < 0.55 && catscope.cat_void_frac > 0.25) { 
      writeOut(test_voidfrac_out,test_result[1]);
      $('#test_voidfrac').prop("class","clcd-green");
    } else if (catscope.cat_void_frac >= 0.55 || catscope.cat_void_frac <= 0.25) {
      //actually write the result to the appropriate field
      writeOut(test_voidfrac_out,test_result[0]);
      $('#test_voidfrac').prop("class","clcd-red");
    } else {
      writeOut(test_voidfrac_out,'Undefined');
      $('#test_voidfrac').prop("class","");
    }


    if (catscope.cat_thermal_cond < 1 && catscope.cat_thermal_cond > 0.1) { 
      writeOut(test_kp_out,test_result[1]);
      $('#test_kp').prop("class","clcd-green");
    } else if (catscope.cat_thermal_cond >= 1 || catscope.cat_thermal_cond <= 0.1) {
      //actually write the result to the appropriate field
      writeOut(test_kp_out,test_result[0]);
      $('#test_kp').prop("class","clcd-red");
    } else {
      writeOut(test_kp_out,'Undefined');
      $('#test_kp').prop("class","");
    }


    if (catscope.cat_porosity < 0.7) { 
      writeOut(test_porosity_out,test_result[1]);
      $('#test_porosity').prop("class","clcd-green");
    } else if (catscope.cat_porosity >= 0.7) {
      //actually write the result to the appropriate field
      writeOut(test_porosity_out,test_result[0]);
      $('#test_porosity').prop("class","clcd-red");
    } else {
      writeOut(test_porosity_out,'Undefined');
      $('#test_porosity').prop("class","");
    }

    if (catscope.cat_pore_tortuosity < 6 && catscope.cat_pore_tortuosity > 2) { 
      writeOut(test_tortuosity_out,test_result[1]);
      $('#test_tortuosity').prop("class","clcd-green");
    } else if (catscope.cat_pore_tortuosity >= 6 || catscope.cat_pore_tortuosity <= 2) {
      //actually write the result to the appropriate field
      writeOut(test_tortuosity_out,test_result[0]);
      $('#test_tortuosity').prop("class","clcd-red");
    } else {
      writeOut(test_tortuosity_out,'Undefined');
      $('#test_tortuosity').prop("class","");
    }

    if (catscope.ndim_prandtl < 1.5 && catscope.ndim_prandtl > 0.5) { 
      writeOut(test_ndim_prandtl_out,test_result[1]);
      $('#test_ndim_prandtl').prop("class","clcd-green");
    } else if (catscope.ndim_prandtl >= 1.5 || catscope.ndim_prandtl <= 0.5) {
      //actually write the result to the appropriate field
      writeOut(test_ndim_prandtl_out,test_result[0]);
      $('#test_ndim_prandtl').prop("class","clcd-red");
    } else {
      writeOut(test_ndim_prandtl_out,'Undefined');
      $('#test_ndim_prandtl').prop("class","");
    }

    if (catscope.ndim_reynolds >= 0.01 && catscope.dr_reaction_phase == "Liquid Phase") { 
      writeOut(test_ndim_reynolds_out,test_result[1]);
      $('#test_ndim_reynolds').prop("class","clcd-green");
    } else if (catscope.ndim_reynolds > 1 && catscope.dr_reaction_phase == "Gas Phase") { 
      writeOut(test_ndim_reynolds_out,test_result[1]);
      $('#test_ndim_reynolds').prop("class","clcd-green");
    } else if (catscope.ndim_reynolds <= 0.01 && catscope.dr_reaction_phase == "Liquid Phase") {
      //actually write the result to the appropriate field
      writeOut(test_ndim_reynolds_out,test_result[0]);
      $('#test_ndim_reynolds').prop("class","clcd-red");
    } else if (catscope.ndim_reynolds <= 1 && catscope.dr_reaction_phase == "Gas Phase") {
      //actually write the result to the appropriate field
      writeOut(test_ndim_reynolds_out,test_result[0]);
      $('#test_ndim_reynolds').prop("class","clcd-red");
    } else {
      writeOut(test_ndim_reynolds_out,'Undefined');
      $('#test_ndim_reynolds').prop("class","");
    }

/////////////////////////////////////////////////////////////////
// logic switch, yes is "bad", no is "good"
//
/////////////////////////////////////////////////////////////////

    if (catscope.ndim_prater < 0.3) { 
      writeOut(test_ndim_prater_out,test_result_alt[0]);
      $('#test_ndim_prater').prop("class","clcd-green");
    } else if (catscope.ndim_prater >= 0.3) {
      //actually write the result to the appropriate field
      writeOut(test_ndim_prater_out,test_result_alt[1]);
      $('#test_ndim_prater').prop("class","clcd-red");
    } else {
      writeOut(test_ndim_prater_out,'Undefined');
      $('#test_ndim_prater').prop("class","");
    }

    if (catscope.rxn_externalconc_grad < 5) { 
      writeOut(test_externalconc_limit_out,test_result_alt[0]);
      $('#test_externalconc_limit').prop("class","clcd-green");
    } else if (catscope.rxn_externalconc_grad >= 5) {
      //actually write the result to the appropriate field
      writeOut(test_externalconc_limit_out,test_result_alt[1]);
      $('#test_externalconc_limit').prop("class","clcd-red");
    } else {
      writeOut(test_externalconc_limit_out,'Undefined');
      $('#test_externalconc_limit').prop("class","");
    }

    if (catscope.rxn_externalconc_grad < 50) { 
      writeOut(test_externalconc_control_out,test_result_alt[0]);
      $('#test_externalconc_control').prop("class","clcd-green");
    } else if (catscope.rxn_externalconc_grad >= 50) {
      //actually write the result to the appropriate field
      writeOut(test_externalconc_control_out,test_result_alt[1]);
      $('#test_externalconc_control').prop("class","clcd-red");
    } else {
      writeOut(test_externalconc_control_out,'Undefined');
      $('#test_externalconc_control').prop("class","");
    }

    if (math.abs(catscope.rxn_externaltemp_grad) < 1) { 
      writeOut(test_externaltemp_out,test_result_alt[0]);
      $('#test_externaltemp').prop("class","clcd-green");
    } else if (math.abs(catscope.rxn_externaltemp_grad) >= 1) {
      //actually write the result to the appropriate field
      writeOut(test_externaltemp_out,test_result_alt[1]);
      $('#test_externaltemp').prop("class","clcd-red");
    } else {
      writeOut(test_externaltemp_out,'Undefined');
      $('#test_externaltemp').prop("class","");
    }

    if (math.abs(catscope.rxn_internaltemp_grad) < 1) { 
      writeOut(test_internaltemp_out,test_result_alt[0]);
      $('#test_internaltemp').prop("class","clcd-green");
    } else if (math.abs(catscope.rxn_internaltemp_grad) >= 1) {
      //actually write the result to the appropriate field
      writeOut(test_internaltemp_out,test_result_alt[1]);
      $('#test_internaltemp').prop("class","clcd-red");
    } else {
      writeOut(test_internaltemp_out,'Undefined');
      $('#test_internaltemp').prop("class","");
    }
/////////////////////////////////////////////////////////////////////
    if (catscope.rxn_eff_factor > 0.95) { 
      writeOut(test_internalconc_limit_out,test_result_alt[0]);
      $('#test_internalconc_limit').prop("class","clcd-green");
    } else if (catscope.rxn_eff_factor <= 0.95) {
      //actually write the result to the appropriate field
      writeOut(test_internalconc_limit_out,test_result_alt[1]);
      $('#test_internalconc_limit').prop("class","clcd-red");
    } else {
      writeOut(test_internalconc_limit_out,'Undefined');
      $('#test_internalconc_limit').prop("class","");
    }

    if (catscope.rxn_eff_factor > 0.5) { 
      writeOut(test_internalconc_strong_out,test_result_alt[0]);
      $('#test_internalconc_strong').prop("class","clcd-green");
    } else if (catscope.rxn_eff_factor <= 0.5) {
      //actually write the result to the appropriate field
      writeOut(test_internalconc_strong_out,test_result_alt[1]);
      $('#test_internalconc_strong').prop("class","clcd-red");
    } else {
      writeOut(test_internalconc_strong_out,'Undefined');
      $('#test_internalconc_strong').prop("class","");
    }

  });

  //////////////////////////////////////////////////////////////////////////////  
  // function for bed-scale validation tests
  $("#rxn_rate,#cat_rho_bulk,#R_p,#molfrac2,#molfrac3,#rxn_surfconcentration,#rxn_surftemperature").on('keyup keydown change', function (){
    //id string of output field
    var test_pressure_drop_out = "#test_pressure_drop";

    var test_mears_dispersion_out = "#test_mears_dispersion"; //
    var test_mears_dispersion_LHS_out = "#test_mears_dispersion_LHS"; //
    var test_mears_dispersion_RHS_out = "#test_mears_dispersion_RHS"; //
    
    var test_gierman_dispersion_out = "#test_gierman_dispersion"; //
    var test_gierman_dispersion_LHS_out = "#test_gierman_dispersion_LHS"; //
    var test_gierman_dispersion_RHS_out = "#test_gierman_dispersion_RHS"; //

    var test_sie_walleffect_out = "#test_sie_walleffect"; //
    var test_sie_walleffect_LHS_out = "#test_sie_walleffect_LHS"; //
    var test_sie_walleffect_RHS_out = "#test_sie_walleffect_RHS"; //

    var test_mears_radial_interparticle_out = "#test_mears_radial_interparticle";
    var test_mears_radial_interparticle_LHS_out = "#test_mears_radial_interparticle_LHS";
    var test_mears_radial_interparticle_RHS_out = "#test_mears_radial_interparticle_RHS";

    //yes-no array
    var test_result = ["no","yes"];
    var test_result_alt = ["no","yes!"];

    //next comes the logical tests used in the sheet

    //pressure drop test -- via Ergun equation dP estimation
    if (catscope.bed_pressure_drop < math.eval('pressure*0.2/dr_rxn_order',catscope)) { //rxn_order is hardcoded to one
      writeOut(test_pressure_drop_out,test_result_alt[0]);
      $('#test_pressure_drop').prop("class","clcd-green");
    } else if (catscope.bed_pressure_drop >= math.eval('pressure*0.2/dr_rxn_order',catscope)) {
      writeOut(test_pressure_drop_out,test_result_alt[1]);
      $('#test_pressure_drop').prop("class","clcd-red");
    } else {
      writeOut(test_pressure_drop_out,'Undefined');
      $('#test_pressure_drop').prop("class","");
    }


    var mearsdisptest = math.eval('20*dr_rxn_order*log(1/(1-rxn_conversion1))',catscope);

    writeOut(test_mears_dispersion_LHS_out,catscope.ndim_peclet);
    writeOut(test_mears_dispersion_RHS_out,mearsdisptest);

    if (catscope.ndim_peclet > mearsdisptest) { 
      writeOut(test_mears_dispersion_out,test_result_alt[0]);
      $('#test_mears_dispersion').prop("class","clcd-green");
    } else if (catscope.ndim_peclet <= mearsdisptest) {
      writeOut(test_mears_dispersion_out,test_result_alt[1]);
      $('#test_mears_dispersion').prop("class","clcd-red");
    } else {
      writeOut(test_mears_dispersion_out,'Undefined');
      $('#test_mears_dispersion').prop("class","");
    }
      
    var lengthratios = math.eval('L_bed/cat_effective_radius_ergun/2',catscope); //Gierman test

    writeOut(test_gierman_dispersion_LHS_out,lengthratios);
    writeOut(test_gierman_dispersion_RHS_out,mearsdisptest);

    if (lengthratios > mearsdisptest) { 
      writeOut(test_gierman_dispersion_out,test_result_alt[0]);
      $('#test_gierman_dispersion').prop("class","clcd-green");
    } else if (lengthratios <= mearsdisptest) {
      writeOut(test_gierman_dispersion_out,test_result_alt[1]);
      $('#test_gierman_dispersion').prop("class","clcd-red");
    } else {
      writeOut(test_gierman_dispersion_out,'Undefined');
      $('#test_gierman_dispersion').prop("class","");
    }


    var siewalleffectstest = math.eval('R_rctr/cat_effective_radius_ergun',catscope);
    var sieLHS = math.eval('radial_disp_coeff*avg_density/R_rctr^2/superf_mass_flux',catscope);
    var sieRHS = math.eval('8*sie_kappa*dr_rxn_order/cat_void_frac*log(1/(1-rxn_conversion1))',catscope);

    writeOut(test_sie_walleffect_LHS_out,sieLHS);
    writeOut(test_sie_walleffect_RHS_out,sieRHS);

    if (siewalleffectstest > 20) { //"good result"
      writeOut(test_sie_walleffect_out,test_result_alt[0]);
      $('#test_sie_walleffect').prop("class","clcd-green");
    } else if (sieLHS > sieRHS) { //"good result"
      writeOut(test_sie_walleffect_out,test_result_alt[0]);
      $('#test_sie_walleffect').prop("class","clcd-green");
    } else if (sieLHS <= sieRHS) { //"bad result" 
      writeOut(test_sie_walleffect_out,test_result_alt[1]);
      $('#test_sie_walleffect').prop("class","clcd-red");
    } else {
      writeOut(test_sie_walleffect_out,'Undefined');
      $('#test_sie_walleffect').prop("class","");
    }

    var mearsRadialInterparticleLHS = math.eval('abs(rxn_enthalpy)*rxn_rate*cat_rho_bulk*R_rctr^2/schlunder_thermal_cond/temp',catscope); 
    var mearsRadialInterparticleRHS = math.eval('0.4*8.3145*temp/rxn_activation_energy/(1 + 4*schlunder_thermal_cond/R_rctr/dixon_h_wall)',catscope);

    writeOut(test_mears_radial_interparticle_LHS_out,mearsRadialInterparticleLHS);
    writeOut(test_mears_radial_interparticle_RHS_out,mearsRadialInterparticleRHS);

    if (mearsRadialInterparticleLHS < mearsRadialInterparticleRHS) {
      writeOut(test_mears_radial_interparticle_out,test_result_alt[0]);
      $('#test_mears_radial_interparticle').prop("class","clcd-green");
    } else if (mearsRadialInterparticleLHS > mearsRadialInterparticleRHS) {
      writeOut(test_mears_radial_interparticle_out,test_result_alt[1]);
      $('#test_mears_radial_interparticle').prop("class","clcd-red");
    } else {
      writeOut(test_mears_radial_interparticle_out,'Undefined');
      $('#test_mears_radial_interparticle').prop("class","");
    }

  });
});


////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////// Now begin section for plotting the graph with Flot
//////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////
//function for plotting graph
$(document).ready(function(){
  $("#plot_data").on('click', function (){
    var position = [2,1.99,1.98,1.97,1.96,1.95,1.94,1.93,1.92,1.91,1.9,1.89,1.88,1.87,1.86,1.85,1.84,1.83,1.82,1.81,1.8,1.79,1.78,1.77,1.76,1.75,1.74,1.73,1.72,1.71,1.7,1.69,1.68,1.67,1.66,1.65,1.64,1.63,1.62,1.61,1.6,1.59,1.58,1.57,1.56,1.55,1.54,1.53,1.52,1.51,1.5,1.49,1.48,1.47,1.46,1.45,1.44,1.43,1.42,1.41,1.4,1.39,1.38,1.37,1.36,1.35,1.34,1.33,1.32,1.31,1.3,1.29,1.28,1.27,1.26,1.25,1.24,1.23,1.22,1.21,1.2,1.19,1.18,1.17,1.16,1.15,1.14,1.13,1.12,1.11,1.1,1.09,1.08,1.07,1.06,1.05,1.04,1.03,1.02,1.01,1,0.99,0.98,0.97,0.96,0.95,0.94,0.93,0.92,0.91,0.9,0.89,0.88,0.87,0.86,0.85,0.84,0.83,0.82,0.81,0.8,0.79,0.78,0.77,0.76,0.75,0.74,0.73,0.72,0.71,0.7,0.69,0.68,0.67,0.66,0.65,0.64,0.63,0.62,0.61,0.6,0.59,0.58,0.57,0.56,0.55,0.54,0.53,0.52,0.51,0.5,0.49,0.48,0.47,0.46,0.45,0.44,0.43,0.42,0.41,0.4,0.39,0.38,0.37,0.36,0.35,0.34,0.33,0.32,0.31,0.3,0.29,0.28,0.27,0.26,0.25,0.24,0.23,0.22,0.21,0.2,0.19,0.18,0.17,0.16,0.15,0.14,0.13,0.12,0.11,0.1,0.09,0.08,0.07,0.06,0.05,0.04,0.03,0.02,0.01,0];

    var BLcoord = math.eval('1 + ndim_BL_thickness',catscope);
    
    var fxnConcentration = math.compile('rxn_surfconcentration*cosh(rxn_thiele*iterNdimPosition)/cosh(rxn_thiele)');
    var fxnConcentrationInlet = math.compile('rxn_surfconcentration_inlet*cosh(rxn_thiele_inlet*iterNdimPosition)/cosh(rxn_thiele_inlet)');
    var fxnConcentrationOutlet = math.compile('rxn_surfconcentration_outlet*cosh(rxn_thiele_outlet*iterNdimPosition)/cosh(rxn_thiele_outlet)');
    var fxnTemperature = math.compile('rxn_surftemperature - rxn_enthalpy*diff_effective/cat_thermal_cond*(rxn_surfconcentration - rxn_surfconcentration*cosh(rxn_thiele*iterNdimPosition)/cosh(rxn_thiele))');

    var fxnBLConcentration = math.compile('(rxn_avg_bulk_concentration1 - rxn_surfconcentration)*iterNdimPosition/ndim_BL_thickness + rxn_avg_bulk_concentration1 - (rxn_avg_bulk_concentration1 - rxn_surfconcentration)/ndim_BL_thickness*(1 + ndim_BL_thickness)');
    var fxnBLConcentrationInlet = math.compile('(res_bulkconc1 - rxn_surfconcentration_inlet)*iterNdimPosition/ndim_BL_thickness + res_bulkconc1 - (res_bulkconc1 - rxn_surfconcentration_inlet)/ndim_BL_thickness*(1 + ndim_BL_thickness)');
    var fxnBLConcentrationOutlet = math.compile('(rxn_bulkconc_outlet1 - rxn_surfconcentration_outlet)*iterNdimPosition/ndim_BL_thickness + rxn_bulkconc_outlet1 - (rxn_bulkconc_outlet1 - rxn_surfconcentration_outlet)/ndim_BL_thickness*(1 + ndim_BL_thickness)');
    var fxnBLTemperature = math.compile('(temp - rxn_surftemperature)*iterNdimPosition/ndim_BL_thickness + temp - (temp - rxn_surftemperature)/ndim_BL_thickness*(1 + ndim_BL_thickness)');

    var concentration = [];
    var concentrationInlet = [];
    var concentrationOutlet = [];
    var temperature = [];

    for (i in position) { //iterate through index 'i' and evaluate the function at each point
      catscope.iterNdimPosition = position[i];
      
      if (catscope.iterNdimPosition > (1 + catscope.ndim_BL_thickness)){ //for outside of the boundary layer
        concentration[i] = catscope.rxn_avg_bulk_concentration1;
        concentrationInlet[i] = catscope.res_bulkconc1;
        concentrationOutlet[i] = catscope.rxn_bulkconc_outlet1;
        temperature[i] = catscope.temp;
      } else if (catscope.iterNdimPosition > 1 && catscope.iterNdimPosition <= (1 + catscope.ndim_BL_thickness)){ //for inside of the boundary layer but outside particle
        concentration[i] = fxnBLConcentration.eval(catscope);
        concentrationInlet[i] = fxnBLConcentrationInlet.eval(catscope);
        concentrationOutlet[i] = fxnBLConcentrationOutlet.eval(catscope);
        temperature[i] = fxnBLTemperature.eval(catscope);
      } else if (catscope.iterNdimPosition <= 1){ //for inside the particle
        concentration[i] = fxnConcentration.eval(catscope);
        concentrationInlet[i] = fxnConcentrationInlet.eval(catscope);
        concentrationOutlet[i] = fxnConcentrationOutlet.eval(catscope);
        temperature[i] = fxnTemperature.eval(catscope);
      }
    }

    var conc = two1Dto2D(position,concentration);
    var concInlet = two1Dto2D(position,concentrationInlet);
    var concOutlet = two1Dto2D(position,concentrationOutlet);
    var temp = two1Dto2D(position,temperature);
    
    $.plot("#internalgradplot", [
      { data: conc, label: "C<sub>A,Average</sub>" },
      { data: concInlet, label: "C<sub>A,Inlet</sub>"},
      { data: concOutlet, label: "C<sub>A,Outlet</sub>"},
      { data: temp, yaxis: 2, label: "Temperature"}
    ], {
      xaxes: [ { axisLabel: 'Position in Catalyst Normalized to Radius / nondimensional' } ],
      yaxes: [ { min: 0, axisLabel: 'Concentration of A / mol × m<sup>-3</sup>', tickDecimals: 1}, { axisLabel: 'Temperature / K', minTickSize: 1, tickDecimals: 1 } ],
      legend: { show: "true", position: "se", background: {color: null}},
      grid: { hoverable: true, //needed for tooltip to work
      markings: [ { color: '#000', lineWidth: 1, xaxis: { from: 1, to: 1 } },
      { color: '#000', lineWidth: 1, xaxis: { from: BLcoord, to: BLcoord } }] }, 
      tooltip: { show: true }

    });

  });
});


////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////// Now begin section for the three popup dialogs; fuller_dvol, lebas_vb,
////// and wilke-chang suggestions
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////
//function for jQuery-UI of fuller diffusion volume dialog
$(document).ready(function(){
  
  $( "#dialog_fuller_dvol" ).dialog({
      autoOpen: false,
      width: 720,
      buttons: [
          {
              text: "Calculate",
              click: function() {
                $('#temp').trigger('change');
              }
          },
          {
              text: "Close",
              click: function() {
                  $( this ).dialog( "close" );
              }
          }
      ]
  });


  $( "#button_fuller_dvol" ).click(function( event ) {
	$( "#dialog_fuller_dvol" ).dialog( "open" );
	event.preventDefault();
  });

});

////////////////////////////////////////////////////////////////////////////
//function for jQuery-UI of Le Bas molar volume @ boiling point
$(document).ready(function(){
  
  $( "#dialog_lebas_vb" ).dialog({
      autoOpen: false,
      width: 820,
      buttons: [
          {
              text: "Calculate",
              click: function() {
                $('#temp').trigger('change');
              }
          },
          {
              text: "Close",
              click: function() {
                  $( this ).dialog( "close" );
              }
          }
      ]
  });


  $( "#button_lebas_vb" ).click(function( event ) {
    $( "#dialog_lebas_vb" ).dialog( "open" );
    event.preventDefault();
  });

});


////////////////////////////////////////////////////////////////////////////
//function for jQuery-UI of phi_Ai recommendation dialog for Wilke-Chang diffusivity
$(document).ready(function(){
  
  $( "#dialog_phiAi" ).dialog({
      autoOpen: false,
      width: 500,
      buttons: [
          {
              text: "Close",
              click: function() {
                  $( this ).dialog( "close" );
              }
          }
      ]
  });


  $( "#button_phi_suggestions" ).click(function( event ) {
	$( "#dialog_phiAi" ).dialog( "open" );
	event.preventDefault();
  });

});




/////////////
// How to add new OUTPUT variables:
// 1. actually write code that uses variables
// 2. add variable names to catscope initialization near top (e.g. catscope.varname = 0;)
// 3. add appropriate field to HTML 



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The following code consists of various functions called above 
// they are a mixture of jQuery and JS functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////




///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//The standard jQuery function 'serializeArray' does not parse checkboxes, this is a modified version that 
//DOES find them and more important returns 'null' when they are unchecked and 'on' when they are checked
$.fn.serializeArrayWithCheckboxes = function() {
  var rCRLF = /\r?\n/g;
  return this.map(function(){
      return this.elements ? jQuery.makeArray( this.elements ) : this;
  })

  .map(function( i, elem ){
      var val = jQuery( this ).val();


      if (val == null) {
        return val == null
      } else if (this.type == "checkbox" && this.checked == false) {
        return { name: this.name, value: this.checked ? this.value : ""}
      } else {
        return jQuery.isArray( val ) ?
              jQuery.map( val, function( val, i ){
                  return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
              }) :
          { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
      }
  }).get();
};


///////////////////////////////////////  
//small function for conversion of strings to floating point numbers
String.prototype.toNum = function(){
  return parseFloat(this);
}

///////////////////////////////////////
//polyfill for Number.isNaN function implemented in ECMAScript 6
Number.isNaN = Number.isNaN || function(value) {
    return typeof value === "number" && isNaN(value);
}

///////////////////////////////////////
//polyfill for Number.isFinite function implemented in ECMAScript 6
Number.isFinite = Number.isFinite || function(value) {
    return typeof value === "number" && isFinite(value);
}


//////////////////////////////////////////////////////////////////////
//this function is used to pre-check output to prevent writing NaN to output cells
function writeOut(formid,value) {
  var formid_handle = $(formid);

  if (typeof value === "string" || value instanceof String) {
    formid_handle.val(value);
  } else if (Number.isFinite(value) || value instanceof Number) {
    formid_handle.val(math.format(value,val_out));
  } else if (isNaN(value)) {
    formid_handle.val(null);
  } else {
    formid_handle.val(null); //value = infinity will get here
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//calculate the binary diffusion coefficient for a pair of gases via the method of Fuller et. al.
function fullerBinaryDiff(mw_1,mw_2,temp,pressure,diffv_1,diffv_2) {
  //pressure needs to have units of bar


  //test if any test is false, else do not perform m.pow
  if (!diffv_1 || !diffv_2) { 
    var inner = 1;
  } else {
    var inner = math.add(math.pow(diffv_1,1/3),math.pow(diffv_2,1/3));
  }
    
  numerator = math.multiply(0.001411,math.pow(temp,1.75));
    
  if (typeof mw_1 !== 'undefined' && typeof mw_2 !== 'undefined') {
    // the variable is defined
    MA = math.divide(1,mw_1);
    MB = math.divide(1,mw_2);
  } else {
    MA=0;
    MB=0;
  }


  MAB = math.multiply(2,math.pow(MA+MB,-1));
  var res_DAB_nonSI = math.divide(numerator,pressure*math.pow(MAB,0.5)*math.pow(inner,2));
  var res_DAB = math.divide(res_DAB_nonSI,1e4); //convert to m^2/s

  return res_DAB;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
function idealGasDensity(mw,temp,pressure) {
  //mw in g/mol
  //temp in kelvin
  //pressure in bar

  var R = 8.3145; //J per mol per K --or-- m^3 * Pa per mol per K
  var pressure_Pa = math.multiply(pressure,100000); //convert to Pascals from bar
      
  ig_density = math.divide(pressure_Pa*mw,R*temp*1000); // kg per m^3

  return ig_density;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
function mearsCriterion(rxn_order,rho_bulk,R_p,k_c,C_Ab,rate_A) {
  //rxn_order is unitless
  //rho_bulk is kg/m^3
  //R_p is in m
  //k_c is m/s
  //C_Ab is in kmol/m^3 (same as mol/L)
  //rate_A is in kmol/kgcat/s
  
  mearsCriterion = math.divide(-rate_A*rho_bulk*R_p*rxn_order,k_c*C_Ab);

  return mearsCriterion;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// a fairly self explanatory function that tests for approximate equality with unity
function doesItSumToOne(molFracArray) {
  var sum = math.sum(molFracArray);
  var sumRound = math.round(sum,2); //if sum is >=0.995 and <=1.004 then this returns 1

  if (sumRound == 1){
    return true;
  } else {
    return false;
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
function molFracMixingFunction(molFracArray,propertyArray) {
  //this function is dumb and doesn't precheck sum-to-one
  var MixingProperty = math.sum(math.multiply(molFracArray,propertyArray));

  return MixingProperty
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//get the particle volume based on dimensions and particle shape
function particleVolume(R_p,L_p,R_p_inner,dr_cat_shape) {
  // this function does not do error reporting of any kind
  var cat_particle_vol;
  if (dr_cat_shape == "Spheres"){
    cat_particle_vol = math.multiply(math.divide(4,3)*3.141592654,math.pow(R_p,3));
  } else if (dr_cat_shape == "Cylinders"){
    cat_particle_vol = math.multiply(3.141592654*L_p,math.pow(R_p,2));
  } else if (dr_cat_shape == "Rings"){
    cat_particle_vol = math.multiply(3.141592654*L_p,math.subtract(math.pow(R_p,2),math.pow(R_p_inner,2)));
  }

  return cat_particle_vol
}

////////////////////////////////////////////////////////////////////////
//function for converting two 1D arrays into a pseudo-2D array for plotting with Flot
function two1Dto2D(a, b) {
  var c = [];
  for (i in a) {
    c[i] = [a[i], b[i]];
  }

  return c
}


//////////////////////////////////////////////////////////////////////
//this function is used to check arrays for NaN values and replace with zero
function replaceNaN(array){
  $.each(array, function(index, value){
    if (isNaN(value)) {
      array[index] = 0;
    } else {
      //do nothing
    }
  })
  return array
}

//////////////////////////////////////////////////////////////////////
//this function is used to check arrays for NaN values and replace with zero
function replaceInfwZero(array){
  $.each(array, function(index, value){
    if (isNaN(value)) {
      array[index] = Infinity;
    } else {
      //do nothing
    }
  })
  return array
}

//////////////////////////////////////////////////////////////////////
//find indexes of elements that have value of Infinity in array
function findInfIndices(array) {
  var InfinityIds = [];
  var j = 0;
  for (var i = 0; i <= array.length; i++) {
    if (array[i] == Infinity) {
      InfinityIds[j] = i;
      j++;
    }
    
  }
  return InfinityIds;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//take input of array in the order and size of the fuller method, then return a molecular formula string
function fullerArrayToFormula(array) {
  var MW_array_labels = ["C", "H", "O", "N", "S", "F", "Cl", "Br", "I"];
  
  var i = array.length;
  while (i--) {
      if (array[i] === 0) {
          array.splice(i, 1);
          MW_array_labels.splice(i, 1);
      }
  }

  var j = array.length;
  var formulaString = [];
  while (j--) {
    formulaString = MW_array_labels[j] + array[j] + formulaString;
  }
  
  return formulaString;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//take input of array in the order and size of the le bas method, then return a molecular formula string
//known bug is duplicate atom labels for different kinds of oxygen e.g. alcohol vs. ether
function lebasArrayToFormula(array) {
  var MW_array_labels = ["C","H","O","O","O","O","O","O","N","N","N","Br","Cl","F","I","S"];
  
  var i = array.length;
  while (i--) {
      if (array[i] === 0) {
          array.splice(i, 1);
          MW_array_labels.splice(i, 1);
      }
  }

  var j = array.length;
  var formulaString = [];
  while (j--) {
    formulaString = MW_array_labels[j] + array[j] + formulaString;
  }
  
  return formulaString;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//mixing function for thermal conductivities for liquids
function li_kf_MixingFunction(catscope) {
  var size = catscope.kfArray.length;
  var iterSize = math.subtract(size,1);

  var li_kf_c = math.zeros(size,size); //pre-initialize size of 'c' mathjs matrix
  
  for (var i = 0; i <= iterSize; i++) {
    for (var j = 0; j <= iterSize; j++) {
      var z = catscope.kfArray[j]/(catscope.kfArray[i] + catscope.kfArray[j]); //this calculates the i-jth component for populating matrix
      li_kf_c.subset(math.index(j,i), z); //replace i-jth component in 'c' with scalar 'z' above
    }
  }

  catscope.li_kf_c = li_kf_c;

  for (var i = 0; i <= iterSize; i++) {
    //look for NaN values and replace with zero; this will happen if
    //there are molecules that are empty and thus have zero kf values
    catscope.li_kf_c._data[i] = replaceNaN(catscope.li_kf_c._data[i]); 
  } 


  catscope.li_kf_d = math.eval('phiHat_Array*li_kf_c',catscope); //1xn times nxn returns 1xn
  catscope.li_kf_e = math.eval('phiHat_Array.*kfArray',catscope);//1xn elementwise times 1xn returns 1xn
  catscope.li_kf_f = math.eval('2*li_kf_e*transpose(li_kf_d)',catscope); //1xn times 1xn^Transpose returns scalar

  return catscope.li_kf_f
}
