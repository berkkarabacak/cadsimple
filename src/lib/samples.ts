export const SAMPLE_HINGE_SCAD = `// Parametric hinge bracket — try the sliders!
plate_width = 80;
plate_depth = 40;
plate_thickness = 6;
pin_radius = 5;
pin_length = 50;
hole_offset = 12;

// base plate
cube([plate_width, plate_depth, plate_thickness]);

// hinge barrel
translate([plate_width / 2, -pin_radius, plate_thickness + pin_radius])
  rotate([0, 90, 0])
    cylinder(h = pin_length, r = pin_radius, center = true);

// mounting posts
translate([hole_offset, hole_offset, plate_thickness])
  cylinder(h = 10, r = 3);
translate([plate_width - hole_offset, hole_offset, plate_thickness])
  cylinder(h = 10, r = 3);
translate([hole_offset, plate_depth - hole_offset, plate_thickness])
  cylinder(h = 10, r = 3);
translate([plate_width - hole_offset, plate_depth - hole_offset, plate_thickness])
  cylinder(h = 10, r = 3);

// door leaf
translate([plate_width / 2 - 3, -pin_radius * 2, plate_thickness + pin_radius])
  cube([6, 4, 60]);
`

export const SAMPLE_KNOB_SCAD = `// Simple parametric knob
radius = 24;
height = 18;
grip = 6;

cylinder(h = height, r = radius);
translate([0, 0, height])
  sphere(r = radius * 0.85);
translate([radius - grip / 2, 0, height / 2])
  cylinder(h = height, r = grip, center = true);
`

export interface SampleDef {
  id: string
  label: string
  description: string
  source: string
  fileName: string
}

export const SAMPLES: SampleDef[] = [
  {
    id: 'hinge',
    label: 'Hinge bracket',
    description: 'Parametric — edit sizes live',
    source: SAMPLE_HINGE_SCAD,
    fileName: 'hinge-bracket.scad',
  },
  {
    id: 'knob',
    label: 'Cabinet knob',
    description: 'Parametric — edit sizes live',
    source: SAMPLE_KNOB_SCAD,
    fileName: 'knob.scad',
  },
]
