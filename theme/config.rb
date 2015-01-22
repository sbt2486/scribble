##
## This file is only needed for Compass/Sass integration. If you are not using
## Compass, you may safely ignore or delete this file.
##
## If you'd like to learn more about Sass and Compass, see the sass/README.txt
## file for more information.
##

# Default to development if environment is not set.
saved = environment
if (environment.nil?)
  environment = :development
else
  environment = saved
end

# Location of the theme's resources.
css_dir = "css"
sass_dir = "sass"
images_dir = "images"
generated_images_dir = images_dir + "/generated"
javascripts_dir = "js"
fonts_dir = "fonts"

# Require any additional compass plugins installed on your system.
require 'compass'
require 'compass-normalize'
require 'rgbapng'
require 'toolkit'
require 'susy'
require 'sass-globbing'
require 'zen-grids'

# Remove query sting from image url when use image-url().
asset_cache_buster :none

##
## You probably don't need to edit anything below this.
##

# You can select your preferred output style here (:expanded, :nested, :compact
# or :compressed).
output_style = (environment == :production) ? :compressed : :expanded

# To enable relative paths to assets via compass helper functions. Since Drupal
# themes can be installed in multiple locations, we don't need to worry about
# the absolute path to the theme from the server omega.
relative_assets = true

# Conditionally enable line comments when in development mode.
# line_comments = (environment == :production) ? false : true
# line_comments = (environment == :development) ? true : false;
line_comments = false;

# Output debugging info in development mode.
# sass_options = (environment == :production) ? {} : {:debug_info => true}

# Add the 'sass' directory itself as an import path to ease imports.
add_import_path 'sass'