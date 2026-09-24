# frozen_string_literal: true

require "jekyll-titles-from-headings"

# Run before jekyll-paginate-v2 (:lowest).
JekyllTitlesFromHeadings::Generator.priority :low
