//
//  ActivityTableCell.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivityTableCell.h"

@implementation ActivityTableCell

// This seems to never be called
- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier
{
    self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
    if (self) {

    }
    return self;
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated
{
    // Todo: Put these in the right place
    self.autoresizingMask = UIViewAutoresizingFlexibleHeight;
    self.clipsToBounds = YES;
    [super setSelected:selected animated:animated];
    if (selected) {
        [self.detailsButton setTitle:@"Hide Details" forState:UIControlStateNormal];
        self.descriptionLabel.hidden = NO;
        self.locationLabel.hidden = NO;
    } else {
        [self.detailsButton setTitle:@"Details" forState:UIControlStateNormal];
        self.descriptionLabel.hidden = YES;
        self.locationLabel.hidden = YES;
    }
}

@end
